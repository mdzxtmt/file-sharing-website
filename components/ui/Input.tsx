import React from 'react'
import { clsx } from 'clsx'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  variant?: 'default' | 'filled' | 'outline'
  inputSize?: 'sm' | 'md' | 'lg'
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ 
    className,
    type = 'text',
    label,
    error,
    helperText,
    leftIcon,
    rightIcon,
    variant = 'default',
    inputSize = 'md',
    disabled,
    ...props 
  }, ref) => {
    const baseClasses = [
      'w-full rounded-lg transition-all duration-200',
      'focus:outline-none focus:ring-2 focus:ring-offset-0',
      'disabled:opacity-60 disabled:cursor-not-allowed',
    ]

    const variantClasses = {
      default: [
        'border border-gray-300 bg-white',
        'focus:border-primary-500 focus:ring-primary-500/20',
        'dark:border-gray-600 dark:bg-gray-800',
        'dark:focus:border-primary-400',
      ],
      filled: [
        'border-0 bg-gray-100',
        'focus:bg-white focus:ring-primary-500/20',
        'dark:bg-gray-700 dark:focus:bg-gray-800',
      ],
      outline: [
        'border-2 border-gray-300 bg-transparent',
        'focus:border-primary-500 focus:ring-primary-500/20',
        'dark:border-gray-600',
      ],
    }

    const sizeClasses = {
      sm: leftIcon || rightIcon ? 'py-2 pl-9 pr-3 text-sm' : 'py-2 px-3 text-sm',
      md: leftIcon || rightIcon ? 'py-2.5 pl-10 pr-4 text-base' : 'py-2.5 px-4 text-base',
      lg: leftIcon || rightIcon ? 'py-3 pl-12 pr-4 text-lg' : 'py-3 px-4 text-lg',
    }

    const errorClasses = error ? [
      'border-error-500 focus:border-error-500 focus:ring-error-500/20',
    ] : []

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {label}
          </label>
        )}
        
        <div className="relative">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <div className="h-5 w-5 text-gray-400">
                {leftIcon}
              </div>
            </div>
          )}
          
          <input
            type={type}
            className={clsx(
              baseClasses,
              variantClasses[variant],
              sizeClasses[inputSize],
              errorClasses,
              className
            )}
            ref={ref}
            disabled={disabled}
            {...props}
          />
          
          {rightIcon && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <div className="h-5 w-5 text-gray-400">
                {rightIcon}
              </div>
            </div>
          )}
        </div>
        
        {error && (
          <p className="mt-1 text-sm text-error-500">
            {error}
          </p>
        )}
        
        {helperText && !error && (
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {helperText}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export default Input
