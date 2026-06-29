package expo.modules.univpnnative

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class UnivpnNativeModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("UnivpnNative")

    AsyncFunction("initialize") {
      // ponytail: plumbing check first; real WireGuard code moves here after module links.
    }

    AsyncFunction("connect") { _: Map<String, Any?> ->
    }

    AsyncFunction("disconnect") {
    }

    AsyncFunction("getStatus") {
      mapOf(
        "isConnected" to false,
        "tunnelState" to "INACTIVE",
        "status" to "DISCONNECTED"
      )
    }

    AsyncFunction("isSupported") {
      true
    }
  }
}
