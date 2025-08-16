import { type RecordWidget, useAsyncCache, Widget } from "attio/client";
import { Suspense } from "react";
import getUserDetails from "../fn/user-details.server";
import { useRelativeTime } from "../hooks/use-relative-time";

const UserWidget = ({ recordId }: { recordId: string }) => {
	const results = useAsyncCache({
		[`user_details_${recordId}`]: [getUserDetails, recordId],
	});

	const userDetails = results.values[`user_details_${recordId}`];
	const bannedUntilTime = useRelativeTime(userDetails?.bannedUntil);

	const capitalizedRole = userDetails.role
		? userDetails.role.charAt(0).toUpperCase() + userDetails.role.slice(1)
		: null;

	return (
		<Widget.TextWidget>
			<Widget.Title>Status</Widget.Title>
			<Widget.Text.Primary>{userDetails.name}</Widget.Text.Primary>
			{userDetails.role !== null ? (
				<>
					<Widget.Text.Secondary>
						{userDetails.banned
							? `${userDetails.banReason || "Banned"}${bannedUntilTime ? ` • Until ${bannedUntilTime}` : ""}`
							: capitalizedRole}
					</Widget.Text.Secondary>
					<Widget.Badge
						text={userDetails.banned ? "Banned" : "Active"}
						color={userDetails.banned ? "red" : "green"}
					/>
				</>
			) : null}
		</Widget.TextWidget>
	);
};

export const recordWidget: RecordWidget = {
	id: "user-status",
	label: "Status",
	Widget: ({ recordId }) => {
		return (
			<Suspense fallback={<Widget.Loading />}>
				<UserWidget recordId={recordId} />
			</Suspense>
		);
	},
	objects: "users",
};
