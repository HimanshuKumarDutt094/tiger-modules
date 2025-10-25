import Foundation
import UIKit

/**
 * Generated base class for ExplorerInput element
 * DO NOT EDIT - This file is auto-generated
 * Extend this class in your implementation
 */
@objcMembers
open class ExplorerInputSpec: LynxUI<UIView> {

    // Abstract method to create the native view
    open override func createView() -> UIView {
        fatalError("Must be implemented by subclass")
    }

    // Property handlers
    @objc open func setBindinput(_ bindinput: (Any) -> Void?) {
        fatalError("Must be implemented by subclass")
    }

    @objc open func setClassName(_ className: String?) {
        fatalError("Must be implemented by subclass")
    }

    @objc open func setId(_ id: String?) {
        fatalError("Must be implemented by subclass")
    }

    @objc open func setStyle(_ style: Any?) {
        fatalError("Must be implemented by subclass")
    }

    @objc open func setValue(_ value: Any?) {
        fatalError("Must be implemented by subclass")
    }

    @objc open func setMaxlines(_ maxlines: Double?) {
        fatalError("Must be implemented by subclass")
    }

    @objc open func setPlaceholder(_ placeholder: String?) {
        fatalError("Must be implemented by subclass")
    }

    // Helper method for event emission
    protected func emitEvent(name: String, value: [String: Any]?) {
        let detail = LynxCustomEvent(sign: getSign(), name: name)
        if let value = value {
            for (key, v) in value {
                detail.addDetail(key, value: v)
            }
        }
        getLynxContext().getEventEmitter().sendCustomEvent(detail)
    }
}