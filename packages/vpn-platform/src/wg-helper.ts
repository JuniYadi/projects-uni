#!/usr/bin/env bun
import { dlopen, FFIType, ptr } from 'bun:ffi'
import { copyFileSync, existsSync } from 'node:fs'
import { argv, env, exit } from 'node:process'
import path from 'node:path'

const command = argv[2]
const arg = argv[3]

const execDir = path.dirname(process.execPath)
const cwd = process.cwd()

function findExisting(paths: (string | undefined | null)[]): string | undefined {
  for (const p of paths) {
    if (p && existsSync(p)) return p
  }
  return undefined
}

const tunnelDllPath =
  findExisting([
    env.UNIVPN_TUNNEL_DLL,
    path.join(execDir, 'tunnel.dll'),
    path.join(execDir, 'win', 'tunnel.dll'),
    path.join(cwd, 'tunnel.dll'),
    path.join(cwd, 'win', 'tunnel.dll'),
  ]) ?? (env.UNIVPN_TUNNEL_DLL || path.join(execDir, 'tunnel.dll'))

const wireguardDllPath =
  findExisting([
    env.UNIVPN_WIREGUARD_DLL,
    path.join(execDir, 'wireguard.dll'),
    path.join(execDir, 'win', 'wireguard.dll'),
    path.join(cwd, 'wireguard.dll'),
    path.join(cwd, 'win', 'wireguard.dll'),
  ]) ?? (env.UNIVPN_WIREGUARD_DLL || path.join(execDir, 'wireguard.dll'))

const adapterName = env.UNIVPN_ADAPTER_NAME ?? 'UniVPN'

// Ensure wireguard.dll is in the executable directory so WireGuard's
// LOAD_LIBRARY_SEARCH_APPLICATION_DIR finds it during service launch
if (existsSync(wireguardDllPath)) {
  const targetWg = path.join(execDir, 'wireguard.dll')
  if (!existsSync(targetWg)) {
    try {
      copyFileSync(wireguardDllPath, targetWg)
    } catch {
      // best-effort
    }
  }
}

// Tell Windows to include the tunnel DLL's directory in DLL search path
try {
  const kernel32 = dlopen('kernel32.dll', {
    SetDllDirectoryW: {
      args: [FFIType.ptr],
      returns: FFIType.bool,
    },
  })
  kernel32.symbols.SetDllDirectoryW(ptr(wstr(path.dirname(tunnelDllPath))))
} catch {
  // best effort
}

function wstr(text: string): Uint8Array {
  // LPCWSTR: UTF-16LE with null terminator
  return Buffer.from(text + '\0', 'utf16le')
}

function loadTunnelDll() {
  if (!existsSync(tunnelDllPath)) {
    throw new Error(`tunnel.dll tidak ditemukan di: ${tunnelDllPath}`)
  }
  try {
    return dlopen(tunnelDllPath, {
      WireGuardTunnelService: {
        args: [FFIType.ptr],
        returns: FFIType.bool,
      },
    })
  } catch (err) {
    throw new Error(`Gagal memuat tunnel.dll (${tunnelDllPath}): ${(err as Error).message}`)
  }
}

function loadWireguardDll() {
  if (!existsSync(wireguardDllPath)) {
    throw new Error(`wireguard.dll tidak ditemukan di: ${wireguardDllPath}`)
  }
  try {
    return dlopen(wireguardDllPath, {
      WireGuardOpenAdapter: {
        args: [FFIType.ptr],
        returns: FFIType.ptr,
      },
      WireGuardGetAdapterState: {
        args: [FFIType.ptr, FFIType.ptr],
        returns: FFIType.bool,
      },
      WireGuardCloseAdapter: {
        args: [FFIType.ptr],
        returns: FFIType.void,
      },
    })
  } catch (err) {
    throw new Error(`Gagal memuat wireguard.dll (${wireguardDllPath}): ${(err as Error).message}`)
  }
}

function send(obj: unknown) {
  console.log(JSON.stringify(obj))
}

if (command === 'connect') {
  if (!arg) {
    console.error('Usage: wg-helper connect <confPath>')
    exit(1)
  }

  try {
    const tunnel = loadTunnelDll()
    const ok = tunnel.symbols.WireGuardTunnelService(ptr(wstr(arg)))
    if (!ok) {
      send({ status: 'error', error: 'WireGuardTunnelService returned false' })
      exit(1)
    }
    send({ status: 'started' })
    // WireGuardTunnelService blocks until the tunnel is stopped.
  } catch (err) {
    send({ status: 'error', error: (err as Error).message })
    exit(1)
  }
} else if (command === 'status') {
  try {
    const wg = loadWireguardDll()
    const adapter = wg.symbols.WireGuardOpenAdapter(ptr(wstr(adapterName)))
    if (!adapter) {
      send({ status: 'disconnected' })
      exit(0)
    }
    const state = new Uint32Array(1)
    const ok = wg.symbols.WireGuardGetAdapterState(adapter, ptr(state))
    wg.symbols.WireGuardCloseAdapter(adapter)
    // WireGuard adapter state: 0 = down, 1 = up
    send({ status: ok && state[0] === 1 ? 'connected' : 'disconnected' })
  } catch (err) {
    send({ status: 'error', error: (err as Error).message })
    exit(1)
  }
} else if (command === 'stats') {
  // ponytail: parsing WireGuardGetConfiguration struct deferred
  send({ bytesSent: 0, bytesReceived: 0 })
} else {
  console.error('Unknown command:', command)
  exit(1)
}
