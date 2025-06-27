import React from 'react'
import { clsx } from 'clsx'

export interface LoadingProps {
  size?: 'sm' | 'md' | 'lg'
  variant?: 'spinner' | 'dots' | 'pulse'
  color?: 'primary' | 'gray' | 'white'
  text?: string
  fullScreen?: boolean
  className?: string
}

const Loading: React.FC<LoadingProps> = ({
  size = 'md',
  variant = 'spinner',
  color = 'primary',
  text,
  fullScreen = false,
  className,
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  }

  const colorClasses = {
    primary: 'text-primary-500',
    gray: 'text-gray-500',
    white: 'text-white',
  }

  const Spinner = () => (
    <svg
      className={clsx(
        'animate-spin',
        sizeClasses[size],
        colorClasses[color]
      )}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  )

  const Dots = () => (
    <div className="flex space-x-1">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={clsx(
            'rounded-full animate-pulse',
            size === 'sm' ? 'w-1 h-1' : size === 'md' ? 'w-2 h-2' : 'w-3 h-3',
            color === 'primary' ? 'bg-primary-500' : 
            color === 'gray' ? 'bg-gray-500' : 'bg-white'
          )}
          style={{
            animationDelay: `${i * 0.2}s`,
            animationDuration: '1s',
          }}
        />
      ))}
    </div>
  )

  const Pulse = () => (
    <div
      className={clsx(
        'rounded-full animate-pulse',
        sizeClasses[size],
        color === 'primary' ? 'bg-primary-500' : 
        color === 'gray' ? 'bg-gray-500' : 'bg-white'
      )}
    />
  )

  const renderVariant = () => {
    switch (variant) {
      case 'dots':
        return <Dots />
      case 'pulse':
        return <Pulse />
      default:
        return <Spinner />
    }
  }

  const content = (
    <div className={clsx(
      'flex flex-col items-center justify-center gap-3',
      className
    )}>
      {renderVariant()}
      {text && (
        <p className={clsx(
          'text-sm font-medium',
          colorClasses[color]
        )}>
          {text}
        </p>
      )}
    </div>
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
        {content}
      </div>
    )
  }

  return content
}

export default Loading
