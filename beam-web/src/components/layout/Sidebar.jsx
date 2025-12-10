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
} from '@ant-design/icons';
import { Menu, Input, Avatar, Typography, Button, ConfigProvider, theme, Dropdown, Grid } from 'antd';

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

	const userLabelItems = useMemo(() => {
		return (labels || [])
			.filter(label => label.type !== 'system' || label.id === 'STARRED')
			.map(label => ({
				key: `label-${label.id}`,
				icon: (
					<span
						style={{
							width: 8,
							height: 8,
							borderRadius: '50%',
							display: 'inline-block',
							background: label.color?.backgroundColor || '#8a83ff',
						}}
					/>
				),
				label: (
					<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
						<span style={{ color: '#d6dae8' }}>{label.name}</span>
						<Text style={{ fontSize: 11, color: '#8c8c8c' }}>
							{label.messagesUnread ?? 0}
						</Text>
					</div>
				),
			}));
	}, [labels]);

	const menuItems = useMemo(() => {
		const items = [
			{
				type: 'group',
				label: 'Mail',
				children: coreMailItems,
			},
		];

		if (userLabelItems.length) {
			items.push({
				type: 'group',
				label: 'Labels',
				children: userLabelItems,
			});
		}

		items.push({ type: 'divider' });
		items.push(...utilityItems);

		return items;
	}, [userLabelItems]);

	const labelGraph = useMemo(() => {
		return (labels || [])
			.filter(label => label.type !== 'system')
			.sort((a, b) => (b.messagesTotal ?? 0) - (a.messagesTotal ?? 0))
			.slice(0, 5);
	}, [labels]);

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
					}
				}
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
						selectedKeys={[selectedKey]}
						onClick={({ key }) => onMenuSelect?.(key)}
						style={{ borderRight: 0, background: 'transparent' }}
						items={menuItems}
					/>
					<div style={{ padding: '0 16px 16px' }}>
						<div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
							<TagOutlined style={{ color: '#8c8c8c' }} />
							<Text style={{ color: '#8c8c8c', fontSize: 12, letterSpacing: '0.05em' }}>LABEL GRAPH</Text>
						</div>
						{labelGraph.length ? (
							labelGraph.map(label => {
								const total = label.messagesTotal ?? 0;
								const unread = label.messagesUnread ?? 0;
								const percent = total ? Math.min(100, Math.round((unread / total) * 100)) : unread ? 100 : 0;
								const color = label.color?.backgroundColor || '#8a83ff';
								return (
									<div key={label.id} style={{ marginBottom: 8 }}>
										<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
											<span style={{ color: '#d6dae8', fontSize: 12 }}>{label.name}</span>
											<Text style={{ fontSize: 11, color: '#8c8c8c' }}>
												{unread}
												{total ? `/${total}` : ''}
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

				<div style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #303030' }}>
					<div style={{ display: 'flex', gap: '16px' }} />
					<Button shape="circle" icon={<QuestionCircleOutlined />} />
				</div>
			</div>
		</ConfigProvider>
	);
};

export default Sidebar;
