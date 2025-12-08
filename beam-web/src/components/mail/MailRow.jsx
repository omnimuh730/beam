import React, { useState } from 'react';
import {
	StarOutlined,
	DeleteOutlined,
	MailOutlined,
	AppstoreOutlined,
	MoreOutlined,
	SearchOutlined,
	FilterOutlined,
	ReloadOutlined,
	ArrowLeftOutlined,
	PrinterOutlined,
	ClockCircleOutlined,
	FolderOpenOutlined,
	TagOutlined
} from '@ant-design/icons';
import { Avatar, Typography, Tag, ConfigProvider, theme, Checkbox, Tooltip } from 'antd';

const { Text, Title, Paragraph } = Typography;

// --- MOCK DATA ---
const initialData = [
	{
		id: '1',
		group: 'Today',
		sender: 'Woven',
		subject: 'Feedback on your LeoTech work simulation',
		snippet: 'Hi Terry, Thanks for making time to go through our Backend Engineer...',
		tag: 'Application',
		time: '12:24 AM',
		read: true,
	},
	{
		id: '2',
		group: 'Today',
		sender: 'NBCUniversal',
		subject: 'Thank You For Your Interest in NBCUniversal!',
		snippet: 'Hi Terry, Thanks for your interest in NBCUniversal. We really appreciate...',
		tag: 'Application',
		time: '12:04 AM',
		read: true,
	},
	{
		id: '3',
		group: 'Yesterday',
		sender: 'no-reply@asana.com',
		subject: 'Thank you for your application to Asana!',
		snippet: 'Hi Terry, Thanks for your interest in being a part of the Asana team...',
		tag: 'Application',
		time: 'Dec 7',
		read: false,
	},
	{
		id: '4',
		group: 'Yesterday',
		sender: 'The Global Talent Team',
		subject: 'Your experience at Neo4j',
		snippet: 'Email not showing correctly? Click here. Dear Terry, At Neo4j we aim...',
		tag: 'Application',
		time: 'Dec 7',
		read: true,
		avatar: 'https://dist.neo4j.com/wp-content/uploads/20210423062510/neo4j-logo-2020-1.png'
	},
	{
		id: '5',
		group: 'Yesterday',
		sender: 'Google',
		subject: 'Security alert',
		snippet: 'You allowed Notion Mail access to some of your Google Account data...',
		tag: null,
		time: 'Dec 7',
		read: true,
	},
];

const App = () => {
	const [selectedIds, setSelectedIds] = useState([]);
	const [activeEmailId, setActiveEmailId] = useState(null);
	const [hoveredId, setHoveredId] = useState(null);

	const activeEmail = initialData.find(e => e.id === activeEmailId);
	const isSelectionMode = selectedIds.length > 0;

	const toggleSelection = (id, e) => {
		e.stopPropagation();
		if (selectedIds.includes(id)) {
			setSelectedIds(selectedIds.filter(i => i !== id));
		} else {
			setSelectedIds([...selectedIds, id]);
		}
	};

	const selectAll = () => {
		if (selectedIds.length === initialData.length) setSelectedIds([]);
		else setSelectedIds(initialData.map(e => e.id));
	};

	const groupedData = initialData.reduce((acc, item) => {
		(acc[item.group] = acc[item.group] || []).push(item);
		return acc;
	}, {});

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

				{/* --- LEFT PANEL --- */}
				<div style={{
					flex: activeEmailId ? '0 0 450px' : '1',
					display: 'flex',
					flexDirection: 'column',
					borderRight: '1px solid #303030',
					transition: 'all 0.3s cubic-bezier(0.2, 0, 0, 1)'
				}}>

					{/* HEADER */}
					<div style={{
						padding: '12px 24px',
						height: '60px',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'space-between',
						background: isSelectionMode ? '#1e1b2e' : 'transparent',
						borderBottom: '1px solid #303030'
					}}>
						{isSelectionMode ? (
							<>
								<div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
									<Checkbox
										checked={selectedIds.length > 0}
										indeterminate={selectedIds.length > 0 && selectedIds.length < initialData.length}
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
							// DEFAULT HEADER
							<>
								<div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
									<AppstoreOutlined style={{ fontSize: '16px' }} />
									<Title level={5} style={{ margin: 0 }}>All Mail</Title>
								</div>
								<div style={{ display: 'flex', gap: '16px', color: '#a0a0a0' }}>
									<Tag style={{ background: '#262626', border: '1px solid #434343' }}>
										<TagOutlined /> Auto label
									</Tag>
									<FilterOutlined />
									<ReloadOutlined />
								</div>
							</>
						)}
					</div>

					{/* LIST */}
					<div style={{ flex: 1, overflowY: 'auto', padding: '0 12px' }}>
						{Object.keys(groupedData).map(group => (
							<div key={group}>
								<div style={{
									fontSize: '11px', color: '#656c82', letterSpacing: '0.1em',
									textTransform: 'uppercase', height: 40, display: 'flex', alignItems: 'center',
									padding: '0 16px', fontWeight: 600, marginTop: 8
								}}>
									{group}
								</div>

								{groupedData[group].map(item => {
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
												padding: '0 16px', // Internal padding
												margin: '0 0 2px 0', // Vertical gap between items
												height: 40, // Fixed height for consistency
												cursor: 'pointer',
												borderRadius: 8,
												background: isSelected ? '#1e1b2e' : isHovered ? '#1f2129' : (isActive ? '#262626' : 'transparent'),
												// Use box-shadow for the blue bar so it doesn't affect layout width (0 layout shift)
												boxShadow: isSelected ? 'inset 3px 0 0 #8a83ff' : 'none',
												transition: 'background 0.1s ease',
												position: 'relative',
												overflow: 'hidden'
											}}
										>
											{/* Checkbox / Spacer */}
											<div style={{ width: 28, display: 'flex', alignItems: 'center' }} onClick={(e) => e.stopPropagation()}>
												{(isHovered || isSelected) ? (
													<Checkbox checked={isSelected} onChange={(e) => toggleSelection(item.id, e)} />
												) : null}
											</div>

											{/* Content */}
											<div style={{ flex: 1, display: 'flex', alignItems: 'center', minWidth: 0 }}>
												{/* Sender */}
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

												{/* Subject + Snippet */}
												<div style={{ flex: 1, display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
													<Text strong={!item.read} ellipsis style={{ color: !item.read ? '#fff' : '#b0b0b0', fontSize: 13, marginRight: 8 }}>
														{item.subject}
													</Text>
													<Text ellipsis style={{ color: '#666', fontSize: 13, flex: 1 }}>
														{item.snippet}
													</Text>
												</div>
											</div>

											{/* Right Actions */}
											<div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 16 }}>
												{item.tag && (
													<Tag bordered={false} style={{ margin: 0, background: '#2b2640', color: '#a78bfa', fontSize: 11, borderRadius: 10 }}>
														{item.tag}
													</Tag>
												)}

												{/* Hover Actions (Absolute or Fixed Width to prevent jump) */}
												{isHovered ? (
													<div style={{ display: 'flex', gap: 12, color: '#888', minWidth: 60, justifyContent: 'flex-end' }}>
														<DeleteOutlined />
														<MailOutlined />
														<ClockCircleOutlined />
													</div>
												) : (
													<Text style={{ color: '#666', fontSize: 12, minWidth: 60, textAlign: 'right' }}>
														{item.time}
													</Text>
												)}
											</div>
										</div>
									);
								})}
							</div>
						))}
					</div>
				</div>

				{/* --- RIGHT PANEL (Same as before) --- */}
				{activeEmailId && activeEmail && (
					<div style={{ flex: '1', display: 'flex', flexDirection: 'column', background: '#1f1f1f' }}>

						{/* Preview Header */}
						<div style={{ padding: '0 24px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #303030' }}>
							<div style={{ display: 'flex', gap: '16px', color: '#a0a0a0' }}>
								<Tooltip title="Close"><ArrowLeftOutlined onClick={() => setActiveEmailId(null)} style={{ cursor: 'pointer', color: '#fff' }} /></Tooltip>
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

						{/* Email Body */}
						<div style={{ padding: '40px', overflowY: 'auto' }}>
							<Title level={2} style={{ marginBottom: '16px' }}>{activeEmail.subject}</Title>

							<div style={{ display: 'flex', gap: '8px', marginBottom: '32px' }}>
								<Tag bordered={false} style={{ background: '#303030', color: '#d9d9d9' }}>[Gmail]/Important <span style={{ marginLeft: 4 }}>×</span></Tag>
								{activeEmail.tag && <Tag color="purple">{activeEmail.tag} <span style={{ marginLeft: 4 }}>×</span></Tag>}
							</div>

							<div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '24px' }}>
								<Avatar size={48} src={activeEmail.avatar} icon={<AppstoreOutlined />} style={{ backgroundColor: '#fff', color: '#000' }} />
								<div>
									<Text strong style={{ fontSize: '16px', display: 'block' }}>{activeEmail.sender}</Text>
									<Text type="secondary" style={{ fontSize: '12px' }}>to me <MoreOutlined /></Text>
								</div>
								<div style={{ flex: 1 }} />
								<div style={{ display: 'flex', gap: '12px', color: '#8c8c8c' }}>
									<StarOutlined />
									<Text type="secondary" style={{ fontSize: '12px' }}>{activeEmail.time}, 11:27 PM</Text>
								</div>
							</div>

							<Paragraph style={{ fontSize: '16px', lineHeight: '1.8', color: '#d9d9d9' }}>
								Dear Terry, <br /><br />
								At Neo4j we aim at providing a great candidate experience. <br /><br />
								As you recently applied to the GenAI Content Developer role, we'd appreciate you letting us know how your experience was. <br /><br />
								Your feedback is extremely valuable to us.
							</Paragraph>

							{/* Simulated NPS Survey */}
							<div style={{ marginTop: '40px', padding: '24px', background: '#141414', borderRadius: '8px' }}>
								<Text strong style={{ display: 'block', marginBottom: '16px' }}>How much effort did it take to apply for a job?</Text>
								<div style={{ display: 'flex', gap: '8px' }}>
									{[1, 2, 3, 4, 5].map(num => (
										<div key={num} style={{
											width: 40, height: 40, background: '#006d75', color: '#fff',
											display: 'flex', alignItems: 'center', justifyContent: 'center',
											fontWeight: 'bold', borderRadius: 4, cursor: 'pointer'
										}}>
											{num}
										</div>
									))}
								</div>
							</div>

						</div>
					</div>
				)}
			</div>
		</ConfigProvider>
	);
};

export default App;