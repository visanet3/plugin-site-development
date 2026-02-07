'use client';
import type React from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

type GradientBackgroundProps = React.ComponentProps<'div'> & {
	// Animation customization
	gradients?: string[];
	animationDuration?: number;
	animationDelay?: number;

	// Layout customization
	enableCenterContent?: boolean;

	// Visual customization
	overlay?: boolean;
	overlayOpacity?: number;
	blur?: string;
};

const Default_Gradients = [
	"linear-gradient(135deg, #1a1430 0%, #0a4d48 100%)",
	"linear-gradient(135deg, #2d1854 0%, #1a0066 100%)",
	"linear-gradient(135deg, #0a1f33 0%, #4d1f33 100%)",
	"linear-gradient(135deg, #0d2e36 0%, #2d4d3d 100%)",
	"linear-gradient(135deg, #1a1430 0%, #0a4d48 100%)",
];

export function GradientBackground({
	children,
	className = '',
	gradients = Default_Gradients,
	animationDuration = 8,
	animationDelay = 0.5,
	overlay = false,
	overlayOpacity = 0.3,
	blur = '0px',
}: GradientBackgroundProps) {
	return (
		<div className={cn('w-full relative min-h-screen overflow-hidden', className)}>
			{/* Animated gradient background */}
			<motion.div
				className="absolute inset-0"
				style={{ 
					background: gradients[0],
					filter: blur ? `blur(${blur})` : undefined
				}}
				animate={{ background: gradients }}
				transition={{
					delay: animationDelay,
					duration: animationDuration,
					repeat: Number.POSITIVE_INFINITY,
					ease: 'easeInOut',
				}}
			/>

			{/* Optional overlay */}
			{overlay && (
				<div
					className="absolute inset-0 bg-black"
					style={{ opacity: overlayOpacity }}
				/>
			)}

			{/* Content wrapper */}
			{children && (
				<div
					className={cn(
						'relative z-10 flex min-h-screen items-center justify-center',
					)}
				>
					{children}
				</div>
			)}
		</div>
	);
}