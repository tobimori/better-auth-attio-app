import { type RecordWidget, useAsyncCache, Widget } from "attio/client";
import { Suspense } from "react";
import { showWorkspaceInvitationsDialog } from "../dialog/workspace-invitations";
import getWorkspaceInvitations from "../fn/workspace-invitations.server";
import { useRelativeTime } from "../hooks/use-relative-time";

const InvitationsWidget = ({ recordId }: { recordId: string }) => {
	const results = useAsyncCache({
		[`invitations_${recordId}`]: [getWorkspaceInvitations, recordId],
	});

	const { invitations, count } = results.values[`invitations_${recordId}`];
	const mostRecentInvitation = invitations[0];
	const relativeTime = useRelativeTime(mostRecentInvitation?.expiresAt);

	const capitalizedRole = mostRecentInvitation?.role
		? mostRecentInvitation.role.charAt(0).toUpperCase() +
			mostRecentInvitation.role.slice(1)
		: null;

	return (
		<Widget.TextWidget
			onTrigger={() => showWorkspaceInvitationsDialog(recordId)}
		>
			<Widget.Title>Pending Invitations</Widget.Title>
			{mostRecentInvitation ? (
				<>
					<Widget.Text.Primary>
						{mostRecentInvitation.email}
					</Widget.Text.Primary>
					<Widget.Text.Secondary>
						{mostRecentInvitation.status === "pending"
							? `Pending • ${capitalizedRole}`
							: mostRecentInvitation.status}{" "}
						• {relativeTime}
					</Widget.Text.Secondary>
				</>
			) : (
				<Widget.Text.Primary>No invitations</Widget.Text.Primary>
			)}
			<Widget.Badge
				text={count.toString()}
				color={count > 0 ? "blue" : "grey"}
			/>
		</Widget.TextWidget>
	);
};

export const recordWidget: RecordWidget = {
	id: "workspace-invitations",
	label: "Invitations",
	Widget: ({ recordId }) => {
		return (
			<Suspense fallback={<Widget.Loading />}>
				<InvitationsWidget recordId={recordId} />
			</Suspense>
		);
	},
	objects: "workspaces",
};
