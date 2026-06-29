package expo.modules.univpnnative

import android.net.VpnService
import com.wireguard.android.backend.GoBackend
import com.wireguard.android.backend.Tunnel
import com.wireguard.android.backend.Statistics
import com.wireguard.config.Config
import com.wireguard.config.InetNetwork
import com.wireguard.config.Interface
import com.wireguard.config.ParseException
import com.wireguard.config.Peer
import com.wireguard.crypto.Key
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.net.InetAddress

class UnivpnNativeModule : Module() {
  private var backend: GoBackend? = null
  private var tunnel: Tunnel? = null
  private var wgConfig: Config? = null

  override fun definition() = ModuleDefinition {
    Name("UnivpnNative")

    AsyncFunction("initialize") {
      if (backend == null) backend = GoBackend(appContext.reactContext ?: throw Exception("React context unavailable"))
    }

    AsyncFunction("connect") { config: Map<String, Any?> ->
      val context = appContext.reactContext ?: throw Exception("React context unavailable")
      val intent = VpnService.prepare(context)
      if (intent != null) {
        appContext.currentActivity?.startActivityForResult(intent, 1000)
        throw Exception("Please accept the Android VPN permission dialog, then tap Connect again.")
      }

      if (backend == null) backend = GoBackend(context)
      wgConfig = buildConfig(config)
      tunnel = object : Tunnel {
        override fun getName() = "WireGuardTunnel"
        override fun onStateChange(newState: Tunnel.State) {
          // ponytail: JS polls getStatus; native events later if needed.
        }
      }
      backend!!.setState(tunnel!!, Tunnel.State.UP, wgConfig!!)
      Unit
    }

    AsyncFunction("disconnect") {
      val t = tunnel
      val c = wgConfig
      val b = backend
      if (t != null && c != null && b != null) b.setState(t, Tunnel.State.DOWN, c)
      Unit
    }

    AsyncFunction("getStatus") {
      try {
        val state = if (tunnel != null && backend != null) backend!!.getState(tunnel!!) else Tunnel.State.DOWN
        val stats = if (state == Tunnel.State.UP && tunnel != null && backend != null) backend!!.getStatistics(tunnel!!) else null
        statusMap(state, stats)
      } catch (e: Exception) {
        mapOf("isConnected" to false, "tunnelState" to "ERROR", "status" to "ERROR", "error" to e.message)
      }
    }

    AsyncFunction("isSupported") { true }
  }

  private fun buildConfig(config: Map<String, Any?>): Config {
    val iface = Interface.Builder()
    iface.parsePrivateKey(requiredString(config, "privateKey"))

    list(config, "address").ifEmpty { listOf("10.64.0.1/32") }.forEach {
      iface.addAddress(InetNetwork.parse(it))
    }

    list(config, "dns").forEach { iface.addDnsServer(InetAddress.getByName(it)) }
    int(config, "mtu")?.let {
      if (it < 1280 || it > 65535) throw Exception("MTU must be between 1280 and 65535, got: $it")
      iface.setMtu(it)
    }

    val peer = Peer.Builder()
    peer.parsePublicKey(requiredString(config, "publicKey"))
    string(config, "presharedKey")?.let { peer.setPreSharedKey(Key.fromBase64(it)) }
    peer.parseEndpoint("${requiredString(config, "serverAddress")}:${requiredInt(config, "serverPort")}")

    val allowed = list(config, "allowedIPs").map { it.replace("::0/0", "::/0") }
    if (allowed.isEmpty()) throw Exception("allowedIPs must contain at least one CIDR")
    try {
      allowed.forEach { peer.addAllowedIp(InetNetwork.parse(it)) }
    } catch (e: ParseException) {
      throw Exception("Invalid allowedIP: ${e.message}. Use ::/0 for IPv6 default, not ::0/0.")
    }

    return Config.Builder().setInterface(iface.build()).addPeer(peer.build()).build()
  }

  private fun statusMap(state: Tunnel.State?, stats: Statistics?) = when (state) {
    Tunnel.State.UP -> mapOf(
      "isConnected" to true,
      "tunnelState" to "ACTIVE",
      "status" to "CONNECTED",
      "bytesReceived" to (stats?.totalRx() ?: 0L).toDouble(),
      "bytesSent" to (stats?.totalTx() ?: 0L).toDouble()
    )
    Tunnel.State.DOWN -> mapOf("isConnected" to false, "tunnelState" to "INACTIVE", "status" to "DISCONNECTED")
    else -> mapOf("isConnected" to false, "tunnelState" to "UNKNOWN", "status" to "UNKNOWN")
  }

  private fun string(m: Map<String, Any?>, key: String) = m[key] as? String
  private fun requiredString(m: Map<String, Any?>, key: String) = string(m, key) ?: throw Exception("$key is required")
  private fun int(m: Map<String, Any?>, key: String) = (m[key] as? Number)?.toInt()
  private fun requiredInt(m: Map<String, Any?>, key: String) = int(m, key) ?: throw Exception("$key is required")
  private fun list(m: Map<String, Any?>, key: String): List<String> = when (val v = m[key]) {
    is String -> listOf(v).filter { it.isNotBlank() }
    is List<*> -> v.filterIsInstance<String>().map { it.trim() }.filter { it.isNotBlank() }
    else -> emptyList()
  }
}
