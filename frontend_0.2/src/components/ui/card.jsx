import * as React from "react"

import { cn } from "@/lib/utils"

/** @type {React.ForwardRefRenderFunction<HTMLDivElement, React.ComponentPropsWithoutRef<'div'> & { children?: React.ReactNode }>} */
const Card = React.forwardRef(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("rounded-xl border bg-neutral-100 dark:bg-slate-900 text-card-foreground shadow", className)}
    {...props}
  >
    {children}
  </div>
))
Card.displayName = "Card"

/** @type {React.ForwardRefRenderFunction<HTMLDivElement, React.ComponentPropsWithoutRef<'div'> & { children?: React.ReactNode }>} */
const CardHeader = React.forwardRef(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  >
    {children}
  </div>
))
CardHeader.displayName = "CardHeader"

/** @type {React.ForwardRefRenderFunction<HTMLDivElement, React.ComponentPropsWithoutRef<'div'> & { children?: React.ReactNode }>} */
const CardTitle = React.forwardRef(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("font-semibold leading-none tracking-tight", className)}
    {...props}
  >
    {children}
  </div>
))
CardTitle.displayName = "CardTitle"

/** @type {React.ForwardRefRenderFunction<HTMLDivElement, React.ComponentPropsWithoutRef<'div'> & { children?: React.ReactNode }>} */
const CardDescription = React.forwardRef(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  >
    {children}
  </div>
))
CardDescription.displayName = "CardDescription"

/** @type {React.ForwardRefRenderFunction<HTMLDivElement, React.ComponentPropsWithoutRef<'div'> & { children?: React.ReactNode }>} */
const CardContent = React.forwardRef(({ className, children, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props}>
    {children}
  </div>
))
CardContent.displayName = "CardContent"

/** @type {React.ForwardRefRenderFunction<HTMLDivElement, React.ComponentPropsWithoutRef<'div'> & { children?: React.ReactNode }>} */
const CardFooter = React.forwardRef(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  >
    {children}
  </div>
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
