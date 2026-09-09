import * as React from 'react'
import { Button as ButtonPrimitive } from '@base-ui/react/button'
import { cva, type VariantProps } from 'class-variance-authority'
import { Loader2 } from 'lucide-react'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-xl border border-transparent text-sm font-medium whitespace-nowrap transition-all duration-150 outline-none select-none focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 min-h-[44px] px-4 py-2.5 shadow-xs cursor-pointer [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:opacity-90 active:opacity-100',
        outline:
          'border-border bg-card text-foreground hover:bg-secondary hover:text-foreground active:bg-secondary/80',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-secondary/80 active:bg-secondary/90',
        ghost:
          'shadow-none hover:bg-secondary hover:text-foreground active:bg-secondary/80',
        destructive:
          'bg-destructive text-white hover:bg-destructive/90 active:bg-destructive',
        link: 'shadow-none text-primary underline-offset-4 hover:underline min-h-0 px-0 py-0',
      },
      size: {
        default: 'h-11 min-h-[44px] gap-2 px-4 py-2.5 text-sm',
        sm: 'h-9 min-h-[36px] gap-1.5 px-3 py-1.5 text-xs rounded-lg',
        lg: 'h-12 min-h-[48px] gap-2 px-6 py-3 text-base rounded-2xl',
        icon: 'size-11 min-h-[44px] min-w-[44px] p-0 rounded-xl',
        'icon-sm': 'size-9 min-h-[36px] min-w-[36px] p-0 rounded-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

export interface ButtonProps
  extends ButtonPrimitive.Props,
    VariantProps<typeof buttonVariants> {
  loading?: boolean
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading = false, disabled, children, asChild, ...props }, ref) => {
    if (asChild && React.isValidElement(children)) {
      const child = children as React.ReactElement<{ className?: string }>
      return React.cloneElement(child, {
        className: cn(buttonVariants({ variant, size, className }), child.props.className),
        ...props,
      } as any)
    }

    return (
      <ButtonPrimitive
        ref={ref}
        data-slot="button"
        disabled={disabled || loading}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      >
        {loading && <Loader2 className="size-4 animate-spin mr-1.5" aria-hidden="true" />}
        {children}
      </ButtonPrimitive>
    )
  },
)
Button.displayName = 'Button'

export { Button, buttonVariants }
