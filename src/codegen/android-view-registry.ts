/**
 * Android View Type Registry
 * Contains common Android view types with their full class names and import paths
 */

export interface AndroidViewTypeInfo {
  fullName: string;      // Full class name (e.g., "androidx.appcompat.widget.AppCompatEditText")
  package: string;       // Package for import (e.g., "androidx.appcompat.widget")
  shortName: string;     // Short name for imports (e.g., "AppCompatEditText")
}

/**
 * Registry of common Android view types
 */
export const ANDROID_VIEW_TYPES: Record<string, AndroidViewTypeInfo> = {
  // Basic Android Views
  'View': {
    fullName: 'android.view.View',
    package: 'android.view',
    shortName: 'View'
  },
  'ViewGroup': {
    fullName: 'android.view.ViewGroup',
    package: 'android.view',
    shortName: 'ViewGroup'
  },
  
  // Text Views
  'TextView': {
    fullName: 'android.widget.TextView',
    package: 'android.widget',
    shortName: 'TextView'
  },
  'EditText': {
    fullName: 'android.widget.EditText',
    package: 'android.widget',
    shortName: 'EditText'
  },
  'AppCompatTextView': {
    fullName: 'androidx.appcompat.widget.AppCompatTextView',
    package: 'androidx.appcompat.widget',
    shortName: 'AppCompatTextView'
  },
  'AppCompatEditText': {
    fullName: 'androidx.appcompat.widget.AppCompatEditText',
    package: 'androidx.appcompat.widget',
    shortName: 'AppCompatEditText'
  },
  
  // Buttons
  'Button': {
    fullName: 'android.widget.Button',
    package: 'android.widget',
    shortName: 'Button'
  },
  'AppCompatButton': {
    fullName: 'androidx.appcompat.widget.AppCompatButton',
    package: 'androidx.appcompat.widget',
    shortName: 'AppCompatButton'
  },
  'ImageButton': {
    fullName: 'android.widget.ImageButton',
    package: 'android.widget',
    shortName: 'ImageButton'
  },
  'AppCompatImageButton': {
    fullName: 'androidx.appcompat.widget.AppCompatImageButton',
    package: 'androidx.appcompat.widget',
    shortName: 'AppCompatImageButton'
  },
  
  // Image Views
  'ImageView': {
    fullName: 'android.widget.ImageView',
    package: 'android.widget',
    shortName: 'ImageView'
  },
  'AppCompatImageView': {
    fullName: 'androidx.appcompat.widget.AppCompatImageView',
    package: 'androidx.appcompat.widget',
    shortName: 'AppCompatImageView'
  },
  
  // Layout Views
  'LinearLayout': {
    fullName: 'android.widget.LinearLayout',
    package: 'android.widget',
    shortName: 'LinearLayout'
  },
  'RelativeLayout': {
    fullName: 'android.widget.RelativeLayout',
    package: 'android.widget',
    shortName: 'RelativeLayout'
  },
  'FrameLayout': {
    fullName: 'android.widget.FrameLayout',
    package: 'android.widget',
    shortName: 'FrameLayout'
  },
  'ConstraintLayout': {
    fullName: 'androidx.constraintlayout.widget.ConstraintLayout',
    package: 'androidx.constraintlayout.widget',
    shortName: 'ConstraintLayout'
  },
  
  // List Views
  'ListView': {
    fullName: 'android.widget.ListView',
    package: 'android.widget',
    shortName: 'ListView'
  },
  'RecyclerView': {
    fullName: 'androidx.recyclerview.widget.RecyclerView',
    package: 'androidx.recyclerview.widget',
    shortName: 'RecyclerView'
  },
  
  // Progress Views
  'ProgressBar': {
    fullName: 'android.widget.ProgressBar',
    package: 'android.widget',
    shortName: 'ProgressBar'
  },
  'SeekBar': {
    fullName: 'android.widget.SeekBar',
    package: 'android.widget',
    shortName: 'SeekBar'
  },
  
  // Input Views
  'CheckBox': {
    fullName: 'android.widget.CheckBox',
    package: 'android.widget',
    shortName: 'CheckBox'
  },
  'RadioButton': {
    fullName: 'android.widget.RadioButton',
    package: 'android.widget',
    shortName: 'RadioButton'
  },
  'Switch': {
    fullName: 'android.widget.Switch',
    package: 'android.widget',
    shortName: 'Switch'
  },
  'AppCompatCheckBox': {
    fullName: 'androidx.appcompat.widget.AppCompatCheckBox',
    package: 'androidx.appcompat.widget',
    shortName: 'AppCompatCheckBox'
  },
  'AppCompatRadioButton': {
    fullName: 'androidx.appcompat.widget.AppCompatRadioButton',
    package: 'androidx.appcompat.widget',
    shortName: 'AppCompatRadioButton'
  },
  'SwitchCompat': {
    fullName: 'androidx.appcompat.widget.SwitchCompat',
    package: 'androidx.appcompat.widget',
    shortName: 'SwitchCompat'
  },
  
  // Scroll Views
  'ScrollView': {
    fullName: 'android.widget.ScrollView',
    package: 'android.widget',
    shortName: 'ScrollView'
  },
  'HorizontalScrollView': {
    fullName: 'android.widget.HorizontalScrollView',
    package: 'android.widget',
    shortName: 'HorizontalScrollView'
  },
  'NestedScrollView': {
    fullName: 'androidx.core.widget.NestedScrollView',
    package: 'androidx.core.widget',
    shortName: 'NestedScrollView'
  },
  
  // Web Views
  'WebView': {
    fullName: 'android.webkit.WebView',
    package: 'android.webkit',
    shortName: 'WebView'
  },
  
  // Toolbar and AppBar
  'Toolbar': {
    fullName: 'androidx.appcompat.widget.Toolbar',
    package: 'androidx.appcompat.widget',
    shortName: 'Toolbar'
  },
  'AppBarLayout': {
    fullName: 'com.google.android.material.appbar.AppBarLayout',
    package: 'com.google.android.material.appbar',
    shortName: 'AppBarLayout'
  },
  
  // Material Design Components
  'FloatingActionButton': {
    fullName: 'com.google.android.material.floatingactionbutton.FloatingActionButton',
    package: 'com.google.android.material.floatingactionbutton',
    shortName: 'FloatingActionButton'
  },
  'MaterialButton': {
    fullName: 'com.google.android.material.button.MaterialButton',
    package: 'com.google.android.material.button',
    shortName: 'MaterialButton'
  },
  'TextInputLayout': {
    fullName: 'com.google.android.material.textfield.TextInputLayout',
    package: 'com.google.android.material.textfield',
    shortName: 'TextInputLayout'
  },
  'TextInputEditText': {
    fullName: 'com.google.android.material.textfield.TextInputEditText',
    package: 'com.google.android.material.textfield',
    shortName: 'TextInputEditText'
  },
  'CardView': {
    fullName: 'androidx.cardview.widget.CardView',
    package: 'androidx.cardview.widget',
    shortName: 'CardView'
  },
  'MaterialCardView': {
    fullName: 'com.google.android.material.card.MaterialCardView',
    package: 'com.google.android.material.card',
    shortName: 'MaterialCardView'
  }
};

/**
 * Resolves an Android view type from the registry
 * @param viewType - The view type to resolve (can be short name or full name)
 * @returns AndroidViewTypeInfo if found, undefined otherwise
 */
export function resolveAndroidViewType(viewType: string): AndroidViewTypeInfo | undefined {
  // First try exact match with short name
  if (ANDROID_VIEW_TYPES[viewType]) {
    return ANDROID_VIEW_TYPES[viewType];
  }
  
  // Try to find by full name
  for (const info of Object.values(ANDROID_VIEW_TYPES)) {
    if (info.fullName === viewType) {
      return info;
    }
  }
  
  // Try to find by package + short name combination
  for (const info of Object.values(ANDROID_VIEW_TYPES)) {
    if (viewType === `${info.package}.${info.shortName}`) {
      return info;
    }
  }
  
  return undefined;
}

/**
 * Gets all available Android view type names (short names)
 * @returns Array of short names for all registered view types
 */
export function getAvailableViewTypes(): string[] {
  return Object.keys(ANDROID_VIEW_TYPES);
}

/**
 * Creates an AndroidViewTypeInfo from a custom view type string
 * @param viewType - The custom view type (full class name)
 * @returns AndroidViewTypeInfo for the custom type
 */
export function createCustomAndroidViewType(viewType: string): AndroidViewTypeInfo {
  // Extract package and class name from full class name
  const lastDotIndex = viewType.lastIndexOf('.');
  
  if (lastDotIndex === -1) {
    // No package, assume it's in android.view
    return {
      fullName: `android.view.${viewType}`,
      package: 'android.view',
      shortName: viewType
    };
  }

  const packageName = viewType.substring(0, lastDotIndex);
  const shortName = viewType.substring(lastDotIndex + 1);

  return {
    fullName: viewType,
    package: packageName,
    shortName: shortName
  };
}

/**
 * Checks if a view type is registered in the registry (including custom types)
 * @param viewType - The view type to check
 * @returns true if the view type is registered, false otherwise
 */
export function isValidAndroidViewType(viewType: string): boolean {
  return resolveAndroidViewType(viewType) !== undefined;
}

/**
 * Validation result for Android view types
 */
export interface AndroidViewTypeValidationResult {
  isValid: boolean;
  resolvedType?: AndroidViewTypeInfo;
  errorMessage?: string;
  warningMessage?: string;
}

/**
 * Validates an Android view type and provides detailed feedback
 * @param viewType - The view type to validate
 * @returns Validation result with resolved type or error information
 */
export function validateAndroidViewType(viewType: string): AndroidViewTypeValidationResult {
  if (!viewType || typeof viewType !== 'string') {
    return {
      isValid: false,
      errorMessage: 'Android view type must be a non-empty string'
    };
  }

  // Trim whitespace
  const trimmedViewType = viewType.trim();
  
  if (trimmedViewType.length === 0) {
    return {
      isValid: false,
      errorMessage: 'Android view type cannot be empty or whitespace only'
    };
  }

  // Try to resolve the view type
  const resolvedType = resolveAndroidViewType(trimmedViewType);
  
  if (resolvedType) {
    return {
      isValid: true,
      resolvedType
    };
  }

  // Check if it looks like a valid Android class name format
  const androidClassNamePattern = /^[a-zA-Z][a-zA-Z0-9]*(\.[a-zA-Z][a-zA-Z0-9]*)*\.[A-Z][a-zA-Z0-9]*$/;
  
  if (androidClassNamePattern.test(trimmedViewType)) {
    // It looks like a valid class name but is not in our registry
    // Allow custom view types by creating a dynamic AndroidViewTypeInfo
    const lastDotIndex = trimmedViewType.lastIndexOf('.');
    const packageName = trimmedViewType.substring(0, lastDotIndex);
    const shortName = trimmedViewType.substring(lastDotIndex + 1);
    
    return {
      isValid: true,
      resolvedType: {
        fullName: trimmedViewType,
        package: packageName,
        shortName: shortName
      },
      warningMessage: `Using custom Android view type: ${trimmedViewType}. This type is not in the built-in registry but will be used as specified.`
    };
  }

  // Invalid format
  return {
    isValid: false,
    errorMessage: `Invalid Android view type format: '${trimmedViewType}'. Expected format: 'package.name.ClassName' or a registered short name like 'AppCompatEditText'.`
  };
}

/**
 * Validates and resolves an Android view type with fallback to default View
 * @param viewType - The view type to validate and resolve
 * @returns Resolved AndroidViewTypeInfo (either the requested type or fallback to View)
 */
export function validateAndResolveAndroidViewType(viewType: string): {
  resolvedType: AndroidViewTypeInfo;
  hasWarnings: boolean;
  messages: string[];
} {
  const validation = validateAndroidViewType(viewType);
  const messages: string[] = [];
  let hasWarnings = false;

  if (validation.isValid && validation.resolvedType) {
    // Add warning message if it's a custom type
    if (validation.warningMessage) {
      messages.push(`Warning: ${validation.warningMessage}`);
      hasWarnings = true;
    }
    
    return {
      resolvedType: validation.resolvedType,
      hasWarnings,
      messages
    };
  }

  // Add error/warning messages
  if (validation.errorMessage) {
    messages.push(`Error: ${validation.errorMessage}`);
    hasWarnings = true;
  }
  
  if (validation.warningMessage) {
    messages.push(`Warning: ${validation.warningMessage}`);
    hasWarnings = true;
  }

  // Fallback to default View type
  const defaultViewType = ANDROID_VIEW_TYPES['View'];
  messages.push(`Falling back to default View type: ${defaultViewType.fullName}`);

  return {
    resolvedType: defaultViewType,
    hasWarnings: true,
    messages
  };
}

/**
 * Error messages for common validation scenarios
 */
export const ANDROID_VIEW_TYPE_ERROR_MESSAGES = {
  INVALID_FORMAT: (type: string) => 
    `Invalid Android view type format: '${type}'. Expected format: 'package.name.ClassName' or a registered short name.`,
  NOT_FOUND: (type: string) => 
    `Android view type '${type}' not found in registry. Using default View type.`,
  EMPTY_TYPE: 'Android view type cannot be empty.',
  MALFORMED_ANNOTATION: (annotation: string) => 
    `Malformed @androidViewType annotation: '${annotation}'. Expected format: @androidViewType full.package.ClassName`,
  SUGGESTION: (availableTypes: string[]) => 
    `Available view types include: ${availableTypes.slice(0, 10).join(', ')}${availableTypes.length > 10 ? ', ...' : ''}`
} as const;

export function resolveCustomViewConfig(customView: { name: string; package?: string }): AndroidViewTypeInfo {
  // First try to resolve from built-in registry
  const registryType = resolveAndroidViewType(customView.name);
  
  if (registryType) {
    // If package is overridden in config, use that
    if (customView.package) {
      return {
        ...registryType,
        package: customView.package,
        fullName: `${customView.package}.${registryType.shortName}`
      };
    }
    return registryType;
  }

  // If not in registry, treat as custom view type
  // Check if name is already a full class name
  if (customView.name.includes('.')) {
    const lastDotIndex = customView.name.lastIndexOf('.');
    const packageName = customView.package || customView.name.substring(0, lastDotIndex);
    const shortName = customView.name.substring(lastDotIndex + 1);
    
    return {
      fullName: customView.name,
      package: packageName,
      shortName: shortName
    };
  }

  // If just a short name and not in registry, use provided package or default
  const packageName = customView.package || 'android.view';
  return {
    fullName: `${packageName}.${customView.name}`,
    package: packageName,
    shortName: customView.name
  };
}

/**
 * Gets type-safe view type names for TypeScript autocomplete
 * @returns Union type of all available view type names
 */
export type AndroidViewTypeName = keyof typeof ANDROID_VIEW_TYPES;

/**
 * Type guard to check if a string is a valid Android view type name
 * @param name - The name to check
 * @returns true if the name is a valid view type
 */
export function isAndroidViewTypeName(name: string): name is AndroidViewTypeName {
  return name in ANDROID_VIEW_TYPES;
}