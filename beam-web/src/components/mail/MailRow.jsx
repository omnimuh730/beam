import React, { useEffect, useMemo, useState } from 'react';
import {
	StarOutlined,
	DeleteOutlined,
	MailOutlined,
	AppstoreOutlined,
	MoreOutlined,
	FilterOutlined,
	ReloadOutlined,
	ArrowLeftOutlined,
	PrinterOutlined,
	ClockCircleOutlined,
	FolderOpenOutlined,
	TagOutlined,
} from '@ant-design/icons';
import {
	Avatar,
	Typography,
	Tag,
	ConfigProvider,
	theme,
	Checkbox,
	Tooltip,
	Empty,
	Spin,
	Alert,
} from 'antd';

const { Text, Title } = Typography;

const isSameDay = (a, b) =>
	a &&
	b &&
	a.getFullYear() === b.getFullYear() &&
	a.getMonth() === b.getMonth() &&
	a.getDate() === b.getDate();

const formatGroupLabel = date => {
	if (!date) return 'No date';
	const today = new Date();
	const yesterday = new Date();
	yesterday.setDate(today.getDate() - 1);
	if (isSameDay(date, today)) return 'Today';
	if (isSameDay(date, yesterday)) return 'Yesterday';
	return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const formatListTime = date => {
	if (!date) return '—';
	const today = new Date();
	if (isSameDay(date, today)) {
		return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
	}
	return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const formatPreviewTimestamp = date =>
	date
		? date.toLocaleString(undefined, {
			weekday: 'short',
			month: 'short',
			day: 'numeric',
			hour: 'numeric',
			minute: '2-digit',
		})
		: '';

const extractSender = header => {
	if (!header) return 'Unknown sender';
	const match = header.match(/"?(.*?)"?\s*<(.+?)>/);
	if (match && match[1]) {
		return match[1];
	}
	return header.replace(/<.*?>/g, '').trim();
};

const MailRow = ({
	user,
	messages = [],
	labels = [],
	activeLabelId = null,
	loading = false,
	error = null,
	onRefresh,
}) => {
	const [selectedIds, setSelectedIds] = useState([]);
	const [activeEmailId, setActiveEmailId] = useState(null);
	const [hoveredId, setHoveredId] = useState(null);

	const labelLookup = useMemo(() => {
		const map = new Map();
		(labels || []).forEach(label => map.set(label.id, label));
		return map;
	}, [labels]);

	const activeLabel = activeLabelId ? labelLookup.get(activeLabelId) : null;

	const sourceMessages = useMemo(() => {
		if (!activeLabelId) {
			return messages || [];
		}
		return (messages || []).filter(message =>
			(message.labelIds || []).includes(activeLabelId),
		);
	}, [messages, activeLabelId]);

	const preparedMessages = useMemo(() => {
		return sourceMessages
			.map(message => {
				const date = message.internalDate ? new Date(message.internalDate) : null;
				const userLabel = (message.labelIds || [])
					.map(id => labelLookup.get(id))
					.find(label => label && label.type !== 'system');

				return {
					...message,
					date,
					sender: extractSender(message.from),
					group: formatGroupLabel(date),
					displayTime: formatListTime(date),
					read: !(message.labelIds || []).includes('UNREAD'),
					tag: userLabel
						? {
							name: userLabel.name,
							color: userLabel.color?.backgroundColor || '#2b2640',
						}
						: null,
					snippet: message.snippet || message.plainBody?.slice(0, 120),
				};
			})
			.sort((a, b) => {
				const timeA = a.date ? a.date.getTime() : 0;
				const timeB = b.date ? b.date.getTime() : 0;
				return timeB - timeA;
			});
	}, [sourceMessages, labelLookup]);

	const headerTitle = activeLabel?.name || 'All Mail';

	const groupedMessages = useMemo(() => {
		const groups = [];
		const map = new Map();
		preparedMessages.forEach(message => {
			if (!map.has(message.group)) {
				const bucket = [];
				map.set(message.group, bucket);
				groups.push({ name: message.group, items: bucket });
			}
			map.get(message.group).push(message);
		});
		return groups;
	}, [preparedMessages]);

	useEffect(() => {
		setSelectedIds(ids => ids.filter(id => preparedMessages.some(msg => msg.id === id)));
		if (activeEmailId && !preparedMessages.some(msg => msg.id === activeEmailId)) {
			setActiveEmailId(null);
		}
	}, [preparedMessages, activeEmailId]);

	const activeEmail = preparedMessages.find(msg => msg.id === activeEmailId);
	const isSelectionMode = selectedIds.length > 0;

	const toggleSelection = (id, e) => {
		e.stopPropagation();
		setSelectedIds(prev => (prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]));
	};

	const selectAll = () => {
		if (selectedIds.length === preparedMessages.length) setSelectedIds([]);
		else setSelectedIds(preparedMessages.map(e => e.id));
	};

	const renderActiveBody = () => {
		if (!activeEmail) return null;
		if (activeEmail.htmlBody) {
			return (
				<div
					style={{ fontSize: '15px', lineHeight: 1.8, color: '#d9d9d9', wordBreak: 'break-word' }}
					dangerouslySetInnerHTML={{ __html: activeEmail.htmlBody }}
				/>
			);
		}
		if (activeEmail.plainBody) {
			return (
				<pre style={{ fontSize: '15px', lineHeight: 1.8, color: '#d9d9d9', whiteSpace: 'pre-wrap', background: 'transparent', border: 'none', padding: 0, margin: 0 }}>
					{activeEmail.plainBody}
				</pre>
			);
		}
		return <Text style={{ color: '#8c8c8c' }}>No body preview available. Open in Gmail for the full message.</Text>;
	};

	return (
		<ConfigProvider
			theme={{
				algorithm: theme.darkAlgorithm,
				token: {
					colorBgContainer: '#141414',
					colorPrimary: '#8a83ff',
				},
			}}
		>
			<div style={{ display: 'flex', height: '100vh', background: '#141414', color: '#e0e0e0', overflow: 'hidden' }}>
				<div
					style={{
						flex: activeEmailId ? '0 0 450px' : '1',
						display: 'flex',
						flexDirection: 'column',
						borderRight: '1px solid #303030',
						transition: 'all 0.3s cubic-bezier(0.2, 0, 0, 1)',
					}}
				>
					<div
						style={{
							padding: '12px 24px',
							height: '60px',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'space-between',
							background: isSelectionMode ? '#1e1b2e' : 'transparent',
							borderBottom: '1px solid #303030',
						}}
					>
						{isSelectionMode ? (
							<>
								<div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
									<Checkbox
										checked={selectedIds.length > 0}
										indeterminate={selectedIds.length > 0 && selectedIds.length < preparedMessages.length}
										onChange={selectAll}
									/>
									<Text style={{ color: '#8a83ff', fontWeight: 500 }}>{selectedIds.length} selected</Text>
								</div>
								<div style={{ display: 'flex', gap: '16px', fontSize: '18px', color: '#a0a0a0' }}>
									<DeleteOutlined />
									<MailOutlined />
									<FolderOpenOutlined />
									<MoreOutlined />
								</div>
							</>
						) : (
							<>
								<div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
									<AppstoreOutlined style={{ fontSize: '16px' }} />
									<Title level={5} style={{ margin: 0 }}>{headerTitle}</Title>
									{user && (
										<span
											style={{
												padding: '0 10px',
												height: 22,
												display: 'inline-flex',
												alignItems: 'center',
												fontSize: 12,
												borderRadius: 999,
												background: 'rgba(138, 131, 255, 0.2)',
												color: '#c7c2ff',
												boxShadow: '0 0 6px rgba(138, 131, 255, 0.6)',
											}}
										>
											{user.displayName}
										</span>
									)}
								</div>
								<div style={{ display: 'flex', gap: '16px', color: '#a0a0a0', alignItems: 'center' }}>
									<Tag style={{ background: '#262626', border: '1px solid #434343', margin: 0 }}>
										<TagOutlined /> Auto label
									</Tag>
									<FilterOutlined />
									<Tooltip title="Refresh Gmail">
										<ReloadOutlined onClick={() => onRefresh?.()} style={{ cursor: 'pointer' }} spin={loading} />
									</Tooltip>
								</div>
							</>
						)}
					</div>

					<div style={{ flex: 1, overflowY: 'auto', padding: '0 12px', position: 'relative' }}>
						{error && (
							<Alert
								type="error"
								message="Unable to fetch Gmail messages"
								description={error}
								showIcon
								style={{ margin: '12px 16px', background: '#2a1215', borderColor: '#58181c' }}
							/>
						)}
						{groupedMessages.length === 0 && !loading && !error && (
							<Empty
								description={(
									<Text style={{ color: '#8c8c8c' }}>
										{activeLabel
											? `No conversations for "${activeLabel.name}" yet.`
											: 'No Gmail messages cached yet. Try syncing.'}
									</Text>
								)}
								image={Empty.PRESENTED_IMAGE_SIMPLE}
								style={{ marginTop: 64 }}
							/>
						)}
						{groupedMessages.map(group => (
							<div key={group.name}>
								<div
									style={{
										fontSize: '11px',
										color: '#656c82',
										letterSpacing: '0.1em',
										textTransform: 'uppercase',
										height: 40,
										display: 'flex',
										alignItems: 'center',
										padding: '0 16px',
										fontWeight: 600,
										marginTop: 8,
									}}
								>
									{group.name}
								</div>

								{group.items.map(item => {
									const isSelected = selectedIds.includes(item.id);
									const isHovered = hoveredId === item.id;
									const isActive = activeEmailId === item.id;

									return (
										<div
											key={item.id}
											onMouseEnter={() => setHoveredId(item.id)}
											onMouseLeave={() => setHoveredId(null)}
											onClick={() => setActiveEmailId(item.id)}
											style={{
												display: 'flex',
												alignItems: 'center',
												padding: '0 16px',
												margin: '0 0 2px 0',
												height: 48,
												cursor: 'pointer',
												borderRadius: 8,
												background: isSelected ? '#1e1b2e' : isHovered ? '#1f2129' : isActive ? '#262626' : 'transparent',
												boxShadow: isSelected ? 'inset 3px 0 0 #8a83ff' : 'none',
												transition: 'background 0.1s ease',
												position: 'relative',
												overflow: 'hidden',
											}}
										>
											<div style={{ width: 28, display: 'flex', alignItems: 'center' }} onClick={e => e.stopPropagation()}>
												{(isHovered || isSelected) ? (
													<Checkbox checked={isSelected} onChange={(e) => toggleSelection(item.id, e)} />
												) : null}
											</div>

											<div style={{ flex: 1, display: 'flex', alignItems: 'center', minWidth: 0 }}>
												<div style={{ width: 180, paddingRight: 16 }}>
													<Text
														strong={!item.read}
														style={{
															color: !item.read ? '#f7f9ff' : '#d6dae8',
															fontSize: '13px',
															whiteSpace: 'nowrap',
															overflow: 'hidden',
															textOverflow: 'ellipsis',
														}}
													>
														{item.sender}
													</Text>
												</div>

												<div style={{ flex: 1, display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
													<Text strong={!item.read} ellipsis style={{ color: !item.read ? '#fff' : '#b0b0b0', fontSize: 13, marginRight: 8 }}>
														{item.subject || '(No subject)'}
													</Text>
													<Text ellipsis style={{ color: '#666', fontSize: 13, flex: 1 }}>
														{item.snippet || 'No preview available'}
													</Text>
												</div>
											</div>

											<div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 16 }}>
												{item.tag && (
													<Tag
														bordered={false}
														style={{
															margin: 0,
															background: item.tag.color,
															color: '#fff',
															fontSize: 11,
															borderRadius: 10,
														}}
													>
														{item.tag.name}
													</Tag>
												)}

												{isHovered ? (
													<div style={{ display: 'flex', gap: 12, color: '#888', minWidth: 60, justifyContent: 'flex-end' }}>
														<DeleteOutlined />
														<MailOutlined />
														<ClockCircleOutlined />
													</div>
												) : (
													<Text style={{ color: '#666', fontSize: 12, minWidth: 60, textAlign: 'right' }}>
														{item.displayTime}
													</Text>
												)}
											</div>
										</div>
									);
								})}
							</div>
						))}
						{loading && (
							<div style={{ position: 'absolute', top: 12, right: 24 }}>
								<Spin size="small" tip="Syncing Gmail..." />
							</div>
						)}
					</div>
				</div>

				{activeEmailId && activeEmail && (
					<div style={{ flex: '1', display: 'flex', flexDirection: 'column', background: '#1f1f1f' }}>
						<div style={{ padding: '0 24px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #303030' }}>
							<div style={{ display: 'flex', gap: '16px', color: '#a0a0a0' }}>
								<Tooltip title="Close">
									<ArrowLeftOutlined onClick={() => setActiveEmailId(null)} style={{ cursor: 'pointer', color: '#fff' }} />
								</Tooltip>
								<span style={{ borderLeft: '1px solid #434343' }} />
								<FolderOpenOutlined />
								<DeleteOutlined />
								<MailOutlined />
							</div>
							<div style={{ display: 'flex', gap: '16px', color: '#a0a0a0' }}>
								<PrinterOutlined />
								<MoreOutlined />
							</div>
						</div>

						<div style={{ padding: '40px', overflowY: 'auto' }}>
							<Title level={2} style={{ marginBottom: '16px' }}>{activeEmail.subject || '(No subject)'}</Title>

							<div style={{ display: 'flex', gap: '8px', marginBottom: '32px' }}>
								{(activeEmail.labelIds || []).map(labelId => {
									const label = labelLookup.get(labelId);
									if (!label || label.type === 'system') return null;
									return (
										<Tag key={labelId} bordered={false} style={{ background: label.color?.backgroundColor || '#303030', color: label.color?.textColor || '#d9d9d9' }}>
											{label.name}
										</Tag>
									);
								})}
							</div>

							<div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '24px' }}>
								<Avatar size={48} style={{ backgroundColor: '#fff', color: '#000' }}>
									{(activeEmail.sender || 'A').slice(0, 1)}
								</Avatar>
								<div>
									<Text strong style={{ fontSize: '16px', display: 'block' }}>{activeEmail.sender}</Text>
									<Text type="secondary" style={{ fontSize: '12px' }}>to me <MoreOutlined /></Text>
								</div>
								<div style={{ flex: 1 }} />
								<div style={{ display: 'flex', gap: '12px', color: '#8c8c8c' }}>
									<StarOutlined />
									<Text type="secondary" style={{ fontSize: '12px' }}>
										{formatPreviewTimestamp(activeEmail.date)}
									</Text>
								</div>
							</div>

							{renderActiveBody()}
						</div>
					</div>
				)}
			</div>
		</ConfigProvider>
	);
};

export default MailRow;
