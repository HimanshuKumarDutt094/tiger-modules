import Foundation

@objcMembers
public final class NativeLocalStorageModule: NSObject, LynxModule {

    public static var name: String {
        return "NativeLocalStorageModule"
    }

    public static var methodLookup: [String : String] {
        return [
        "setStorageItem": NSStringFromSelector(#selector(setStorageItem(key:value:))),
        "getStorageItem": NSStringFromSelector(#selector(getStorageItem(key:callback:))),
        "clearStorage": NSStringFromSelector(#selector(clearStorage()))
        ]
    }

    func setStorageItem(key: String, value: String) {
        UserDefaults.standard.set(value, forKey: key)
    }

    func getStorageItem(key: String, callback: (Any) -> Void) {
        let value = UserDefaults.standard.string(forKey: key)
        callback(value as Any)
    }

    func clearStorage() {
        let domain = Bundle.main.bundleIdentifier!
        UserDefaults.standard.removePersistentDomain(forName: domain)
    }
}