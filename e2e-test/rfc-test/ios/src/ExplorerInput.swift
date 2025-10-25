import Foundation
import UIKit

/**
 * Implementation of ExplorerInput element
 * Extend the generated base class and implement your logic
 */
@objcMembers
public final class ExplorerInput: ExplorerInputSpec {

    override func createView() -> UIView {
        // TODO: Create and return your native view
        // Example: let button = UIButton(); /* setup */; return button
        return UIView()
    }

    override func setBindinput(_ bindinput: (Any) -> Void?) {
        // TODO: Update your view with bindinput
        // Example: view.bindinput = bindinput
    }

    override func setClassName(_ className: String?) {
        // TODO: Update your view with className
        // Example: view.className = className
    }

    override func setId(_ id: String?) {
        // TODO: Update your view with id
        // Example: view.id = id
    }

    override func setStyle(_ style: Any?) {
        // TODO: Update your view with style
        // Example: view.style = style
    }

    override func setValue(_ value: Any?) {
        // TODO: Update your view with value
        // Example: view.value = value
    }

    override func setMaxlines(_ maxlines: Double?) {
        // TODO: Update your view with maxlines
        // Example: view.maxlines = maxlines
    }

    override func setPlaceholder(_ placeholder: String?) {
        // TODO: Update your view with placeholder
        // Example: view.placeholder = placeholder
    }
}