import { useEffect, useState } from "react";

export const useRelativeTime = (dateString: string | null | undefined) => {
	const [, setTick] = useState(0);

	useEffect(() => {
		if (!dateString) return;
		
		const targetDate = new Date(dateString);
		
		const scheduleNextUpdate = () => {
			const now = new Date();
			const diffMs = now.getTime() - targetDate.getTime();
			const diffMins = Math.floor(diffMs / 60000);
			const diffHours = Math.floor(diffMins / 60);
			
			let timeUntilNextUpdate: number;
			
			if (diffMins < 1) {
				// for "just now", update every second
				timeUntilNextUpdate = 1000;
			} else if (diffMins < 60) {
				// for minutes, update at the next minute boundary
				const secondsUntilNextMinute = 60 - new Date().getSeconds();
				timeUntilNextUpdate = secondsUntilNextMinute * 1000;
			} else if (diffHours < 24) {
				// for hours, update at the next hour boundary
				const minutesUntilNextHour = 60 - new Date().getMinutes();
				timeUntilNextUpdate = minutesUntilNextHour * 60000;
			} else {
				// for days, update at the next day boundary
				const now = new Date();
				const tomorrow = new Date(now);
				tomorrow.setDate(tomorrow.getDate() + 1);
				tomorrow.setHours(0, 0, 0, 0);
				timeUntilNextUpdate = tomorrow.getTime() - now.getTime();
			}
			
			const timeout = setTimeout(() => {
				setTick(t => t + 1);
				scheduleNextUpdate();
			}, timeUntilNextUpdate);
			
			return timeout;
		};
		
		const timeout = scheduleNextUpdate();
		
		return () => clearTimeout(timeout);
	}, [dateString]);
	
	// return null if no date string provided
	if (!dateString) return null;
	
	// calculate relative time
	const date = new Date(dateString);
	const now = new Date();
	const diffMs = now.getTime() - date.getTime();
	const diffMins = Math.floor(diffMs / 60000);
	
	if (diffMins < 1) return "Just now";
	if (diffMins < 60) return `${diffMins} mins ago`;
	
	const diffHours = Math.floor(diffMins / 60);
	if (diffHours < 24) return `${diffHours} hours ago`;
	
	const diffDays = Math.floor(diffHours / 24);
	if (diffDays < 7) return `${diffDays} days ago`;
	
	return date.toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
};