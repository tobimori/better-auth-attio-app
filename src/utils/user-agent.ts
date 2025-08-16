export const parseUserAgent = (userAgent: string) => {
	const browserMatch = userAgent.match(
		/(Chrome|Safari|Firefox|Edge)\/([\d.]+)/,
	);
	const osMatch = userAgent.match(/(Windows|Mac|Linux|iPhone|Android)/);
	const isMobile = /Mobile|Android|iPhone/i.test(userAgent);

	return {
		browser: browserMatch
			? `${browserMatch[1]} ${browserMatch[2].split(".")[0]}`
			: "Unknown Browser",
		system: osMatch ? osMatch[1] : "Unknown OS",
		isMobile,
	};
};