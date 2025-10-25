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
        fatalError("Not implemented")
    }

    func getStorageItem(key: String, callback: (Any) -> Void) {
        fatalError("Not implemented")
    }

    func clearStorage() {
        fatalError("Not implemented")
    }
}