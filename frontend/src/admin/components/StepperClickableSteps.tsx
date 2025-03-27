"use client";

import { Step, type StepItem, Stepper, useStepper } from "./stepper";
import { Button } from "@/components/ui/button";



export default function StepperClickableSteps({ steps }) {
	return (
		<div className="flex w-full flex-col gap-4">
			<Stepper
				initialStep={0}
				steps={steps}
				onClickStep={(step, setStep) => {
					alert(`Step ${step + 1} clicked`);
					setStep(step);
				}}
			>
				{steps?.map((stepProps, index) => {
					console.log(steps)
					return (
						<Step key={stepProps.label} {...stepProps}>
							<div className="h-40 flex items-center justify-center my-2 border bg-secondary text-primary rounded-md">
								<h1 className="text-xl">Step {index + 1}</h1>
								{index === 0 && (
									<select>
										{stepProps?.categories?.map((c) => (
											<option key={`category_${c.id}`} value={c.id}>{c.name}</option>
										))}
										
									</select>
								)}
							</div>
						</Step>
					);
				})}
				<Footer />
			</Stepper>
		</div>
	);
}

const Footer = () => {
	const {
		nextStep,
		prevStep,
		resetSteps,
		isDisabledStep,
		hasCompletedAllSteps,
		isLastStep,
		isOptionalStep,
	} = useStepper();
	return (
		<>
			{hasCompletedAllSteps && (
				<div className="h-40 flex items-center justify-center my-2 border bg-secondary text-primary rounded-md">
					<h1 className="text-xl">Woohoo! All steps completed! 🎉</h1>
				</div>
			)}
			<div className="w-full flex justify-end gap-2">
				{hasCompletedAllSteps ? (
					<Button size="sm" onClick={resetSteps}>
						Reset
					</Button>
				) : (
					<>
						<Button
							disabled={isDisabledStep}
							onClick={prevStep}
							size="sm"
							variant="secondary"
						>
							Prev
						</Button>
						<Button size="sm" onClick={nextStep}>
							{isLastStep ? "Finish" : isOptionalStep ? "Skip" : "Next"}
						</Button>
					</>
				)}
			</div>
		</>
	);
};