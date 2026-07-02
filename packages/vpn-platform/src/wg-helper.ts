#!/usr/bin/env bun
import { dlopen, FFIType, ptr } from 'bun:ffi'
import { argv, env, exit } from 'node:process'
import path from 'node:path'

const command = argv[2]
const arg = argv[3]

const tunnelDllPath = env.UNIVPN_TUNNEL_DLL ?? path.join(process.cwd(), 'tunnel.dll')
const wireguardDllPath = env.UNIVPN_WIREGUARD_DLL ?? path.join(process.cwd(), 'wireguard.dll')
const adapterName = env.UNIVPN_ADAPTER_NAME ?? 'UniVPN'

function wstr(text: string): Uint8Array {
  // LPCWSTR: UTF-16LE with null terminator
  return Buffer.from(text + '\0', 'utf16le')
}

function loadTunnelDll() {
  return dlopen(tunnelDllPath, {
    WireGuardTunnelService: {
      args: [FFIType.ptr],
      returns: FFIType.bool,
    },
  })
}

function loadWireguardDll() {
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
