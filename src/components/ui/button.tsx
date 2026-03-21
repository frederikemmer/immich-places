import {Slot} from '@radix-ui/react-slot';
import {cva} from 'class-variance-authority';

import {cn} from '@/utils/cn';

import type {VariantProps} from 'class-variance-authority';
import type {ComponentProps, ReactElement} from 'react';

const buttonVariants = cva(
	'inline-flex shrink-0 items-center justify-center gap-2 rounded-md text-sm font-medium whitespace-nowrap transition-all outline-none focus-visible:border-(--ring) focus-visible:ring-[3px] focus-visible:ring-(--ring)/50 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*="size-"])]:size-4',
	{
		variants: {
			variant: {
				default: 'bg-(--primary) text-(--primary-foreground) hover:bg-(--primary)/90',
				outline: 'border bg-(--background) shadow-xs hover:bg-(--accent) hover:text-(--accent-foreground)',
				ghost: 'hover:bg-(--accent) hover:text-(--accent-foreground)'
			},
			size: {
				default: 'h-9 px-4 py-2 has-[>svg]:px-3',
				sm: 'h-8 gap-1.5 rounded-md px-3 has-[>svg]:px-2.5',
				lg: 'h-10 rounded-md px-6 has-[>svg]:px-4',
				icon: 'size-9'
			}
		},
		defaultVariants: {
			variant: 'default',
			size: 'default'
		}
	}
);

type TButtonProps = ComponentProps<'button'> &
	VariantProps<typeof buttonVariants> & {
		asChild?: boolean;
	};

function Button({
	className,
	variant = 'default',
	size = 'default',
	asChild = false,
	...props
}: TButtonProps): ReactElement {
	if (asChild) {
		return (
			<Slot
				data-slot={'button'}
				data-variant={variant}
				data-size={size}
				className={cn(buttonVariants({variant, size, className}))}
				{...props}
			/>
		);
	}
	return (
		<button
			data-slot={'button'}
			data-variant={variant}
			data-size={size}
			className={cn(buttonVariants({variant, size, className}))}
			{...props}
		/>
	);
}

export {Button, buttonVariants};
