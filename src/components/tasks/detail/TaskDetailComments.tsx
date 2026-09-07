import UserAvatar from '@/components/common/UserAvatar'
import type {ReactionMap, TaskComment, TaskReaction} from '@/types'
import {formatLongDate, getUserDisplayName} from '@/utils/formatting'
import {Fragment, createElement, type FormEvent, type ReactNode, useMemo, useState} from 'react'
import type {TaskDetailSection} from '@/utils/task-detail-helpers'
import CollapsibleSection from './CollapsibleSection'

const COMMON_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🎉', '🔥', '👀']

export default function TaskDetailComments({
	open,
	onToggle,
	taskComments,
	currentUserId,
	editingCommentId,
	editingCommentValue,
	onEditingCommentValueChange,
	commentDraft,
	onCommentDraftChange,
	taskReactions,
	onEditComment,
	onCancelEditComment,
	onSaveEditedComment,
	onDeleteComment,
	onAddComment,
	onAddReaction,
	onRemoveReaction,
}: {
	open: boolean
	onToggle: (section: TaskDetailSection) => void
	taskComments: TaskComment[]
	currentUserId: number
	editingCommentId: number | null
	editingCommentValue: string
	onEditingCommentValueChange: (value: string) => void
	commentDraft: string
	onCommentDraftChange: (value: string) => void
	taskReactions: ReactionMap
	onEditComment: (comment: TaskComment) => void
	onCancelEditComment: () => void
	onSaveEditedComment: (commentId: number) => void
	onDeleteComment: (commentId: number) => void
	onAddComment: (event: FormEvent<HTMLFormElement>) => void
	onAddReaction: (commentId: number, value: string) => void
	onRemoveReaction: (commentId: number, value: string) => void
}) {
	const [pickerCommentId, setPickerCommentId] = useState<number | null>(null)
	const renderedComments = useMemo(
		() => new Map(taskComments.map(comment => [comment.id, renderCommentContent(comment.comment)])),
		[taskComments],
	)

	return (
		<CollapsibleSection title="Comments" section="comments" open={open} onToggle={onToggle}>
			<div className="detail-comments-card">
				<div className="detail-comment-list">
					{taskComments.length > 0 ? taskComments.map(comment => {
						const canManageComment = currentUserId > 0 && Number(comment.author?.id || 0) === currentUserId
						const isEditing = editingCommentId === comment.id
						const createdLabel = comment.created ? formatLongDate(comment.created) : 'Unknown time'
						const wasEdited = Boolean(comment.updated && comment.created && comment.updated !== comment.created)
						const reactions = taskReactions[`comment-${comment.id}`] || []
						const groupedReactions = groupReactions(reactions, currentUserId)
						return (
							<div key={comment.id} className="detail-comment-row" data-task-comment={comment.id}>
								<div className="detail-comment-head">
									<div className="detail-comment-author">
										<span className="detail-comment-token">
											<UserAvatar user={comment.author} size={27} />
										</span>
										<div className="detail-comment-copy">
											<div className="detail-comment-name">{getUserDisplayName(comment.author)}</div>
											<div className="detail-meta">
												{createdLabel}
												{wasEdited ? ' · Edited' : ''}
											</div>
										</div>
									</div>
									{canManageComment ? (
										<div className="detail-comment-actions">
											{isEditing ? null : (
												<button
													className="ghost-button detail-comment-action"
													type="button"
													data-action="edit-task-comment"
													data-task-comment-id={comment.id}
													onClick={() => onEditComment(comment)}
												>
													Edit
												</button>
											)}
											<button
												className="ghost-button detail-comment-action"
												type="button"
												data-action="delete-task-comment"
												data-task-comment-id={comment.id}
												onClick={() => void onDeleteComment(comment.id)}
											>
												Delete
											</button>
										</div>
									) : null}
								</div>
								{isEditing ? (
									<div className="detail-comment-editor">
										<textarea
											className="detail-textarea detail-comment-textarea"
											data-detail-edit-comment={comment.id}
											value={editingCommentValue}
											onChange={event => onEditingCommentValueChange(event.currentTarget.value)}
										/>
										<div className="detail-inline-actions">
											<button
												className="composer-submit"
												type="button"
												data-action="save-task-comment"
												data-task-comment-id={comment.id}
												disabled={!editingCommentValue.trim()}
												onClick={() => void onSaveEditedComment(comment.id)}
											>
												Save
											</button>
											<button className="ghost-button" type="button" onClick={onCancelEditComment}>
												Cancel
											</button>
										</div>
									</div>
								) : (
									<>
										<div className="detail-comment-body">
											{renderedComments.get(comment.id) || 'No comment text'}
										</div>
										<div className="detail-inline-actions">
											{groupedReactions.map(reaction => (
												<button
													key={reaction.value}
													className={`pill-button ${reaction.mine ? '' : 'subtle'}`.trim()}
													type="button"
													data-action="toggle-comment-reaction"
													data-task-comment-id={comment.id}
													data-task-comment-reaction-value={reaction.value}
													onClick={() => {
														if (reaction.mine) {
															onRemoveReaction(comment.id, reaction.value)
															return
														}
														onAddReaction(comment.id, reaction.value)
													}}
												>
													{reaction.value} {reaction.count}
												</button>
											))}
											<button
												className="pill-button subtle"
												type="button"
												data-action="toggle-comment-reaction-picker"
												data-task-comment-id={comment.id}
												onClick={() => setPickerCommentId(current => current === comment.id ? null : comment.id)}
											>
												+
											</button>
										</div>
										{pickerCommentId === comment.id ? (
											<div className="detail-inline-actions">
												{COMMON_REACTIONS.map(reaction => (
													<button
														key={reaction}
														className="pill-button subtle"
														type="button"
														data-action="add-comment-reaction"
														data-task-comment-id={comment.id}
														data-task-comment-reaction-value={reaction}
														onClick={() => {
															onAddReaction(comment.id, reaction)
															setPickerCommentId(null)
														}}
													>
														{reaction}
													</button>
												))}
											</div>
										) : null}
									</>
								)}
							</div>
						)
					}) : <div className="detail-helper-text">No comments yet.</div>}
				</div>
				<form className="detail-comment-form" data-form="add-comment" onSubmit={onAddComment}>
					<textarea
						className="detail-textarea detail-comment-textarea"
						data-detail-comment-input
						placeholder="Add comment"
						value={commentDraft}
						onChange={event => onCommentDraftChange(event.currentTarget.value)}
					/>
					<div className="detail-inline-actions">
						<button className="composer-submit" type="submit" disabled={!commentDraft.trim()}>
							Add comment
						</button>
					</div>
				</form>
			</div>
		</CollapsibleSection>
	)
}

const inlineCommentTags = new Set(['strong', 'b', 'em', 'i', 'code', 's'])
const blockCommentTags = new Set(['p', 'ul', 'ol', 'li', 'blockquote', 'pre'])

function renderCommentContent(rawComment: string) {
	const comment = `${rawComment || ''}`.trim()
	if (!comment) {
		return null
	}

	if (!looksLikeHtml(comment) || typeof DOMParser === 'undefined') {
		return comment
	}

	const doc = new DOMParser().parseFromString(comment, 'text/html')
	const children = [...doc.body.childNodes].map((node, index) => renderCommentNode(node, `comment-${index}`)).filter(Boolean)
	return children.length > 0 ? children : comment
}

function renderCommentNode(node: ChildNode, key: string): ReactNode {
	if (node.nodeType === Node.TEXT_NODE) {
		return node.textContent
	}

	if (node.nodeType !== Node.ELEMENT_NODE) {
		return null
	}

	const element = node as Element
	const tagName = element.tagName.toLowerCase()

	if (tagName === 'br') {
		return <br key={key} />
	}

	if (tagName === 'mention-user') {
		const label = element.getAttribute('data-label') || element.textContent || element.getAttribute('data-id') || 'user'
		const mentionLabel = label.trim().startsWith('@') ? label.trim() : `@${label.trim()}`
		return <span key={key} className="detail-comment-mention">{mentionLabel}</span>
	}

	if (tagName === 'a') {
		const href = normalizeCommentUrl(element.getAttribute('href'))
		const children = renderCommentChildren(element, key)
		if (!href) {
			return <Fragment key={key}>{children}</Fragment>
		}
		return (
			<a key={key} href={href} target="_blank" rel="noreferrer">
				{children.length > 0 ? children : href}
			</a>
		)
	}

	if (tagName === 'img') {
		const imageUrl = normalizeCommentUrl(element.getAttribute('data-src') || element.getAttribute('src'))
		if (!imageUrl) {
			return null
		}
		return (
			<a key={key} className="detail-comment-attachment-preview" data-comment-attachment-preview href={imageUrl} target="_blank" rel="noreferrer">
				Image attachment
			</a>
		)
	}

	const children = renderCommentChildren(element, key)
	if (inlineCommentTags.has(tagName)) {
		const InlineTag = tagName === 'b' ? 'strong' : tagName === 'i' ? 'em' : tagName
		return createElement(InlineTag, {key}, children)
	}

	if (blockCommentTags.has(tagName)) {
		const BlockTag = tagName
		return createElement(BlockTag, {key}, children)
	}

	return <Fragment key={key}>{children}</Fragment>
}

function renderCommentChildren(element: Element, key: string) {
	return [...element.childNodes].map((child, index) => renderCommentNode(child, `${key}-${index}`)).filter(Boolean)
}

function looksLikeHtml(value: string) {
	return /<\/?[a-z][\s\S]*>/i.test(value)
}

function normalizeCommentUrl(value: string | null) {
	const url = `${value || ''}`.trim()
	if (!url || url === '#') {
		return ''
	}

	try {
		const parsed = new URL(url, window.location.origin)
		return ['http:', 'https:'].includes(parsed.protocol) ? parsed.toString() : ''
	} catch {
		return ''
	}
}

function groupReactions(reactions: ReactionMap[string] | Record<string, Array<Record<string, unknown>>> | null | undefined, currentUserId: number) {
	const grouped = new Map<string, {value: string; count: number; mine: boolean}>()
	for (const reaction of normalizeReactionEntries(reactions)) {
		const current = grouped.get(reaction.value) || {
			value: reaction.value,
			count: 0,
			mine: false,
		}
		current.count += 1
		if (reaction.user.id === currentUserId) {
			current.mine = true
		}
		grouped.set(reaction.value, current)
	}
	return [...grouped.values()]
}

function normalizeReactionEntries(
	reactions: ReactionMap[string] | Record<string, Array<Record<string, unknown>>> | null | undefined,
): TaskReaction[] {
	if (Array.isArray(reactions)) {
		return reactions
			.filter(reaction => reaction && typeof reaction === 'object')
			.map(reaction => ({
				value: `${reaction.value || ''}`.trim(),
				user: reaction.user,
			}))
			.filter(reaction => reaction.value && reaction.user)
	}

	if (!reactions || typeof reactions !== 'object') {
		return []
	}

	const normalized: TaskReaction[] = []
	for (const [value, users] of Object.entries(reactions)) {
		if (!Array.isArray(users)) {
			continue
		}

		for (const user of users) {
			if (!user || typeof user !== 'object') {
				continue
			}

			normalized.push({
				value: `${value || ''}`.trim(),
				user: user as unknown as TaskReaction['user'],
			})
		}
	}

	return normalized.filter(reaction => reaction.value && reaction.user)
}
