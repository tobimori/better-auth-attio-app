import { type RecordWidget, showToast, Widget } from "attio/client";
import { Suspense } from "react";

const UserWidget = ({ recordId }: { recordId: string }) => {
	return (
		<Widget.TextWidget
			onTrigger={() => {
				showToast({
					title: "todo",
					variant: "neutral",
				});
			}}
		>
			<Widget.Title>User</Widget.Title>
			<Widget.Text.Primary>Hi Attio</Widget.Text.Primary>
			<Widget.Text.Secondary>Ban Reason</Widget.Text.Secondary>
			<Widget.Badge text="Not banned" color="green" />
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
