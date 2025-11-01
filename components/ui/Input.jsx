import { TextInput, View, Text } from 'react-native';

/**
 * Reusable Input component with consistent styling
 * Inspired by Inertia.js structure
 * 
 * @param {Object} props
 * @param {React.ReactNode|string} props.label - Input label (text or custom component)
 * @param {string} props.placeholder - Placeholder text
 * @param {any} props.value - Input value
 * @param {Function} props.onChangeText - Change handler
 * @param {boolean} props.error - Show error state
 * @param {string} props.errorMessage - Error message text
 * @param {React.ReactNode} props.leftIcon - Icon component for left side
 * @param {React.ReactNode} props.rightIcon - Icon component for right side
 * @param {string} props.className - Additional classes
 * @param {Object} props...rest - All other TextInput props
 */
export default function Input({
  label,
  placeholder,
  value,
  onChangeText,
  error = false,
  errorMessage = '',
  leftIcon,
  rightIcon,
  className = '',
  ...rest
}) {
  return (
    <View className="mb-4">
      {label && (
        typeof label === 'string' ? (
          <Text className="text-sm mb-2 font-medium text-gray-700 dark:text-gray-300">
            {label}
          </Text>
        ) : (
          <View className="mb-2">{label}</View>
        )
      )}
      <View className="relative flex-row items-center">
        {leftIcon && (
          <View className="absolute left-3 z-10">
            {leftIcon}
          </View>
        )}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#999"
          className={`w-full bg-light dark:bg-dark text-black dark:text-white px-4 py-3 rounded-lg border ${error ? 'border-red-500' : 'border-transparent'} ${leftIcon ? 'pl-11' : ''} ${rightIcon ? 'pr-11' : ''} ${className}`}
          {...rest}
        />
        {rightIcon && (
          <View className="absolute right-3 z-10">
            {rightIcon}
          </View>
        )}
      </View>
      {error && errorMessage && (
        <Text className="text-red-500 text-sm mt-1">{errorMessage}</Text>
      )}
    </View>
  );
}

