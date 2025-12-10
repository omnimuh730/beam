import React, { useMemo } from 'react';
import {
	EditOutlined,
	SearchOutlined,
	MailOutlined,
	SendOutlined,
	FileOutlined,
	ExclamationCircleOutlined,
	DeleteOutlined,
	SettingOutlined,
	QuestionCircleOutlined,
	ReloadOutlined,
	TagOutlined,
	StarFilled,
} from '@ant-design/icons';
import { Menu, Input, Avatar, Typography, Button, ConfigProvider, theme, Dropdown, Grid, Tree } from 'antd';
import { LABEL_DRAG_TYPE } from '../../constants/dragTypes';

const { Text } = Typography;
const defaultAvatar = 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix';

const coreMailItems = [
	{ key: 'all', label: 'All Mail', icon: <MailOutlined /> },
	{ key: 'sent', label: 'Sent', icon: <SendOutlined /> },
	{ key: 'drafts', label: 'Drafts', icon: <FileOutlined /> },
	{ key: 'spam', label: 'Spam', icon: <ExclamationCircleOutlined /> },
	{ key: 'trash', label: 'Trash', icon: <DeleteOutlined /> },
];

const utilityItems = [
	{ key: 'settings', label: 'Settings', icon: <SettingOutlined /> },
	{ key: 'feedback', label: 'Send feedback', icon: <QuestionCircleOutlined /> },
];

const Sidebar = ({
	user,
	loadingUser,
	labels = [],
	labelStats,
	selectedKey = 'all',
	onMenuSelect,
	onLogin,
	onLogout,
	onSync,
	syncing,
}) => {
	const screens = Grid.useBreakpoint();
	const isDesktop = screens.lg;
	const isAuthenticated = Boolean(user);
	const isLabelSelection = selectedKey?.startsWith('label-');

	const handleAuthClick = () => {
		if (isAuthenticated) {
			onLogout?.();
		} else {
			onLogin?.();
		}
	};

	const dropdownItems = isAuthenticated
		? [{ key: 'sign-out', label: 'Sign out', danger: true }]
		: [{ key: 'sign-in', label: 'Sign in' }];

	const handleDropdownClick = ({ key }) => {
		if (key === 'sign-out') {
			onLogout?.();
		}
		if (key === 'sign-in') {
			onLogin?.();
		}
	};

	const labelStatsMap = useMemo(() => {
		if (!labelStats) return new Map();
		if (labelStats instanceof Map) return labelStats;
		return new Map(Object.entries(labelStats));
	}, [labelStats]);

	const filteredLabels = useMemo(() => {
		const exclusion = '[notion]';
		return (labels || [])
			.filter(label => label.id !== 'STARRED')
			.filter(label => label.type !== 'system')
			.filter(label => (label.name || '').trim().toLowerCase() !== exclusion);
	}, [labels]);

	const labelTreeData = useMemo(() => {
		if (!filteredLabels.length) return [];

		const nameMap = new Map(filteredLabels.map(label => [label.name, label]));
		const nodeMap = new Map();
		const roots = [];

		const ensureNode = path => {
			let node = nodeMap.get(path);
			if (node) return node;
			const segments = path.split('/');
			const segment = segments[segments.length - 1];
			node = {
				path,
				segment,
				label: nameMap.get(path) || null,
				children: [],
			};
			nodeMap.set(path, node);

			if (segments.length > 1) {
				const parentPath = segments.slice(0, -1).join('/');
				const parentNode = ensureNode(parentPath);
				if (!parentNode.children.some(child => child.path === path)) {
					parentNode.children.push(node);
				}
			} else {
				roots.push(node);
			}

			return node;
		};

		filteredLabels.forEach(label => ensureNode(label.name));

		const sortNodes = nodes => {
			nodes.sort((a, b) => a.segment.localeCompare(b.segment, undefined, { sensitivity: 'base' }));
			nodes.forEach(child => sortNodes(child.children));
		};
		sortNodes(roots);

		const buildTreeNodes = nodes =>
			nodes.map(node => {
				const label = node.label;
				const stats = label ? labelStatsMap.get(label.id) : null;
				const unread = stats?.unread ?? label?.messagesUnread ?? 0;
				const color = label?.color?.backgroundColor || '#8a83ff';
				const key = label ? `label-${label.id}` : `path-${node.path}`;

				return {
					key,
					labelId: label?.id,
					selectable: Boolean(label),
					disableDrag: !label,
					title: (
						<div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%' }}>
							<span
								style={{
									width: 10,
									height: 10,
									borderRadius: '50%',
									background: label ? color : '#383838',
									display: 'inline-flex',
									flexShrink: 0,
								}}
							/>
							<Text
								style={{
									color: '#d6dae8',
									fontSize: 13,
									flex: 1,
									overflow: 'hidden',
									whiteSpace: 'nowrap',
									textOverflow: 'ellipsis',
								}}
							>
								{node.segment}
							</Text>
							{unread > 0 && (
								<Text style={{ fontSize: 11, color: '#8c8c8c' }}>
									{unread}
								</Text>
							)}
						</div>
					),
					children: buildTreeNodes(node.children),
				};
			});

		return buildTreeNodes(roots);
	}, [filteredLabels, labelStatsMap]);

	const menuItems = useMemo(() => {
		return [
			{
				type: 'group',
				label: 'Mail',
				children: coreMailItems,
			},
			{ type: 'divider' },
			...utilityItems,
		];
	}, []);

	const labelGraph = useMemo(() => {
		const enriched = filteredLabels
			.map(label => {
				const stats = labelStatsMap.get(label.id);
				return {
					...label,
					total: stats?.total ?? label.messagesTotal ?? 0,
					unread: stats?.unread ?? label.messagesUnread ?? 0,
				};
			})
			.filter(item => item.total > 0);

		enriched.sort((a, b) => b.total - a.total);
		const items = enriched.slice(0, 5);
		const maxTotal = items.length ? items[0].total : 0;
		return { items, maxTotal };
	}, [filteredLabels, labelStatsMap]);

	const starredLabel = useMemo(
		() => (labels || []).find(label => label.id === 'STARRED'),
		[labels],
	);
	const starredUnread = (() => {
		const stats = labelStatsMap.get('STARRED');
		return stats?.unread ?? starredLabel?.messagesUnread ?? 0;
	})();

	const handleLabelSelect = (_keys, info) => {
		const labelId = info?.node?.labelId;
		if (labelId) {
			onMenuSelect?.(`label-${labelId}`);
		}
	};

	const handleStarredClick = () => {
		onMenuSelect?.('label-STARRED');
	};

	const handleLabelDragStart = info => {
		const labelId = info?.node?.labelId;
		if (!labelId) return;
		const dataTransfer = info?.event?.dataTransfer;
		if (!dataTransfer) return;
		dataTransfer.setData(LABEL_DRAG_TYPE, labelId);
		dataTransfer.setData('text/plain', labelId);
		dataTransfer.effectAllowed = 'copy';
	};

	const handleStarredDragStart = event => {
		if (!starredLabel) return;
		const { dataTransfer } = event;
		if (!dataTransfer) return;
		dataTransfer.setData(LABEL_DRAG_TYPE, 'STARRED');
		dataTransfer.setData('text/plain', 'STARRED');
		dataTransfer.effectAllowed = 'copy';
	};

	const menuSelectedKeys = isLabelSelection ? [] : [selectedKey];
	const labelSelectedKeys = isLabelSelection ? [selectedKey] : [];
	const isStarredSelected = selectedKey === 'label-STARRED';

	return (
		<ConfigProvider
			theme={{
				algorithm: theme.darkAlgorithm,
				token: {
					colorPrimary: '#6b7280',
					colorBgContainer: '#1f1f1f',
				},
				components: {
					Menu: {
						itemSelectedBg: '#333333',
						itemSelectedColor: '#ffffff',
						itemHeight: 40,
						itemMarginInline: 8,
					},
					Tree: {
						colorBgContainer: 'transparent',
						nodeSelectedBg: '#2a2a2a',
						nodeHoverBg: '#1e1e1e',
					},
				},
			}}
		>
			<div
				style={{
					width: '100%',
					minHeight: isDesktop ? '100%' : 'auto',
					height: '100%',
					background: '#141414',
					display: 'flex',
					flexDirection: 'column',
					border: '1px solid #303030',
					borderRadius: isDesktop ? 16 : 12,
					overflow: 'hidden',
				}}
			>
				<div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
					<div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
						<Dropdown menu={{ items: dropdownItems, onClick: handleDropdownClick }} placement="bottom">
							<div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
								<Avatar src={user?.photo || defaultAvatar} shape="square" />
								<div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
									<Text
										strong
										style={{
											color: '#fff',
											padding: '2px 8px',
											borderRadius: 999,
										}}
									>
										{user?.displayName || 'Guest'}
									</Text>
									<Text style={{ color: '#8c8c8c', fontSize: 11 }}>
										{user?.email || 'Sign in to link Gmail'}
									</Text>
								</div>
							</div>
						</Dropdown>
						{!isAuthenticated && (
							<div style={{ display: 'flex', gap: 8 }}>
								<Button
									type={isAuthenticated ? 'default' : 'primary'}
									size="small"
									loading={!isAuthenticated && loadingUser}
									onClick={handleAuthClick}
								>
									Sign in
								</Button>
								<Button type="text" icon={<EditOutlined />} style={{ color: '#fff' }} />
							</div>
						)}
					</div>
					{isAuthenticated && (
						<Button
							size="small"
							type="default"
							icon={<ReloadOutlined spin={syncing} />}
							onClick={() => onSync?.()}
							loading={syncing}
						>
							Sync
						</Button>
					)}
				</div>

				<div style={{ padding: '0 12px 16px 12px' }}>
					<Input
						placeholder="Search"
						prefix={<SearchOutlined style={{ color: '#666' }} />}
						bordered={true}
						style={{ backgroundColor: 'transparent', color: '#fff' }}
					/>
				</div>

				<div style={{ flex: 1, overflowY: 'auto' }}>
					<Menu
						mode="inline"
						selectedKeys={menuSelectedKeys}
						onClick={({ key }) => onMenuSelect?.(key)}
						style={{ borderRight: 0, background: 'transparent' }}
						items={menuItems}
					/>
					<div style={{ padding: '8px 16px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
						{starredLabel && (
							<button
								type="button"
								onClick={handleStarredClick}
								onDragStart={handleStarredDragStart}
								draggable
								style={{
									border: '1px solid #333',
									width: '100%',
									borderRadius: 10,
									padding: '10px 12px',
									background: isStarredSelected ? '#2a2a2a' : 'transparent',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'space-between',
									cursor: 'pointer',
								}}
							>
								<span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
									<StarFilled style={{ color: '#fadb14', fontSize: 18 }} />
									<Text style={{ color: '#f5f5f5', fontWeight: 500 }}>Starred</Text>
								</span>
								{starredUnread > 0 && (
									<Text style={{ color: '#8c8c8c', fontSize: 12 }}>
										{starredUnread}
									</Text>
								)}
							</button>
						)}

						<div>
							<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
								<Text style={{ color: '#8c8c8c', fontSize: 12, letterSpacing: '0.08em' }}>LABELS</Text>
								<Text style={{ color: '#555', fontSize: 11 }}>{filteredLabels.length}</Text>
							</div>
							{labelTreeData.length ? (
								<Tree
									showLine={{ showLeafIcon: false }}
									blockNode
									defaultExpandAll
									draggable
									allowDrop={() => false}
									treeData={labelTreeData}
									selectedKeys={labelSelectedKeys}
									onSelect={handleLabelSelect}
									onDragStart={handleLabelDragStart}
									style={{
										background: 'transparent',
										color: '#d6dae8',
									}}
								/>
							) : (
								<Text style={{ color: '#666', fontSize: 12 }}>Labels will appear here after syncing.</Text>
							)}
						</div>

						<div>
							<div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
								<TagOutlined style={{ color: '#8c8c8c' }} />
								<Text style={{ color: '#8c8c8c', fontSize: 12, letterSpacing: '0.05em' }}>LABEL GRAPH</Text>
							</div>
							{labelGraph.items.length ? (
								labelGraph.items.map(label => {
									const total = label.total;
									const color = label.color?.backgroundColor || '#8a83ff';
									const percent = labelGraph.maxTotal
										? Math.round((total / labelGraph.maxTotal) * 100)
										: 0;
									return (
										<div key={label.id} style={{ marginBottom: 8 }}>
											<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
												<span style={{ color: '#d6dae8', fontSize: 12 }}>{label.name}</span>
												<Text style={{ fontSize: 11, color: '#8c8c8c' }}>
													{total}
												</Text>
											</div>
											<div style={{ height: 6, borderRadius: 999, background: '#1f1f1f', marginTop: 4 }}>
												<div
													style={{
														width: `${percent}%`,
														height: '100%',
														background: color,
														borderRadius: 999,
														transition: 'width 0.3s ease',
													}}
												/>
											</div>
										</div>
									);
								})
							) : (
								<Text style={{ color: '#666', fontSize: 12 }}>Labels will appear here after syncing.</Text>
							)}
						</div>
					</div>
				</div>

				<div style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #303030' }}>
					<div style={{ display: 'flex', gap: '16px' }} />
					<Button shape="circle" icon={<QuestionCircleOutlined />} />
				</div>
			</div>
		</ConfigProvider>
	);
};

export default Sidebar;
