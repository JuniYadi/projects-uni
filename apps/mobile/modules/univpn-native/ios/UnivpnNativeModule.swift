import ExpoModulesCore

public class UnivpnNativeModule: Module {
  public func definition() -> ModuleDefinition {
    Name("UnivpnNative")

    AsyncFunction("initialize") {
      // ponytail: plumbing check first; real WireGuard code moves here after module links.
    }

    AsyncFunction("requestVpnPermission") {
      return true  // ponytail: iOS NEVPNManager permission flows in later
    }

    AsyncFunction("connect") { (_: [String: Any?]) in
    }

    AsyncFunction("disconnect") {
    }

    AsyncFunction("getStatus") {
      return [
        "isConnected": false,
        "tunnelState": "INACTIVE",
        "status": "DISCONNECTED"
      ]
    }

    AsyncFunction("isSupported") {
      return true
    }
  }
}
