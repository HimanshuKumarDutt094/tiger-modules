import Foundation

@objcMembers
public final class LynxjsLinkingModule: NSObject, LynxModule {

    public static var name: String {
        return "LynxjsLinkingModule"
    }

    public static var methodLookup: [String : String] {
        return [
        "openURL": NSStringFromSelector(#selector(openURL(url:callback:))),
        "openSettings": NSStringFromSelector(#selector(openSettings(callback:))),
        "sendIntent": NSStringFromSelector(#selector(sendIntent(action:extras:callback:))),
        "share": NSStringFromSelector(#selector(share(content:options:callback:)))
        ]
    }

    func openURL(url: String, callback: (Any) -> Void) {
        fatalError("Not implemented")
    }

    func openSettings(callback: (Any) -> Void) {
        fatalError("Not implemented")
    }

    func sendIntent(action: String, extras: NSArray?, callback: (Any) -> Void?) {
        fatalError("Not implemented")
    }

    func share(content: String, options: NSDictionary?, callback: (Any) -> Void?) {
        fatalError("Not implemented")
    }
}