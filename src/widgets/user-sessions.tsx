import { type RecordWidget, useAsyncCache, Widget } from "attio/client";
import { Suspense } from "react";
import { showUserSessionsDialog } from "../dialog/user-sessions";
import getSessions from "../fn/sessions.server";
import { useRelativeTime } from "../hooks/use-relative-time";
import { parseUserAgent } from "../utils/user-agent";

const SessionsWidget = ({ recordId }: { recordId: string }) => {
	const results = useAsyncCache({
		sessions: [getSessions, recordId],
	});

	const { sessions: sessionList, activeCount } = results.values.sessions;

	// get the most recent session for display
	const mostRecentSession = sessionList[0];
	const { browser, system } = mostRecentSession
		? parseUserAgent(mostRecentSession.userAgent || "")
		: { browser: "Unknown", system: "Unknown" };

	const relativeTime = useRelativeTime(
		mostRecentSession?.updatedAt || new Date().toISOString(),
	);

	return (
		<Widget.TextWidget
			onTrigger={
				mostRecentSession ? () => showUserSessionsDialog(recordId) : undefined
			}
		>
			<Widget.Title>Sessions</Widget.Title>
			{mostRecentSession ? (
				<>
					<Widget.Text.Primary>
						{system} • {browser}
					</Widget.Text.Primary>
					<Widget.Text.Secondary>
						{mostRecentSession.ipAddress &&
							`IP: ${mostRecentSession.ipAddress} • `}
						Last active: {relativeTime}
					</Widget.Text.Secondary>
				</>
			) : (
				<Widget.Text.Primary>No active sessions</Widget.Text.Primary>
			)}
			<Widget.Badge
				text={activeCount.toString()}
				color={mostRecentSession ? "blue" : "grey"}
			/>
		</Widget.TextWidget>
	);
};

export const recordWidget: RecordWidget = {
	id: "user-sessions",
	label: "Sessions",
	Widget: ({ recordId }) => {
		return (
			<Suspense fallback={<Widget.Loading />}>
				<SessionsWidget recordId={recordId} />
			</Suspense>
		);
	},
	objects: "users",
};
