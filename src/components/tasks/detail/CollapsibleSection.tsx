import {createContext, useContext, type ReactNode} from 'react'
import Caret from '@/components/common/Caret'
import type {TaskDetailSection} from '@/utils/task-detail-helpers'

export const ExpandedTaskSections = createContext(false)

export default function CollapsibleSection({
	title,
	section,
	open,
	onToggle,
	children,
}: {
	title: string
	section: TaskDetailSection
	open: boolean
	onToggle: (section: TaskDetailSection) => void
	children: ReactNode
}) {
	const expanded = useContext(ExpandedTaskSections)
	if (expanded) {
		return (
			<section className="detail-section task-body-section is-open" data-detail-section={section}>
				<h3 className="task-body-section-title">{section === 'organization' ? 'Labels' : section === 'description' ? 'Notes' : title}</h3>
				<div className="detail-section-content">{children}</div>
			</section>
		)
	}
	return (
		<section className={`detail-section ${open ? 'is-open' : ''}`.trim()} data-detail-section={section}>
			<button
				className="detail-section-toggle"
				data-action="toggle-detail-section"
				data-detail-section-toggle={section}
				type="button"
				aria-expanded={open ? 'true' : 'false'}
				onClick={() => onToggle(section)}
			>
				<span className="detail-section-toggle-copy">
					<span className="detail-label">{title}</span>
				</span>
				<span className="detail-section-chevron" aria-hidden="true">
					<Caret expanded={open} />
				</span>
			</button>
			{open ? <div className="detail-section-content">{children}</div> : null}
		</section>
	)
}
