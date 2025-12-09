import React from 'react';
import {
	EditOutlined,
	SearchOutlined,
	InboxOutlined,
	TagsOutlined,
	CalendarOutlined,
	PlusOutlined,
	MailOutlined,
	SendOutlined,
	FileOutlined,
	ExclamationCircleOutlined,
	DeleteOutlined,
	SettingOutlined,
	QuestionCircleOutlined,
	AppstoreOutlined,
	ContainerOutlined
} from '@ant-design/icons';
import { Menu, Input, Avatar, Typography, Button, ConfigProvider, theme } from 'antd';

const { Text } = Typography;
const defaultAvatar = 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix';

const items = [
	{
		type: 'group',
		label: 'Mail',
		children: [
			{ key: 'all', label: 'All Mail', icon: <MailOutlined /> },
			{ key: 'sent', label: 'Sent', icon: <SendOutlined /> },
			{ key: 'drafts', label: 'Drafts', icon: <FileOutlined /> },
			{ key: 'spam', label: 'Spam', icon: <ExclamationCircleOutlined /> },
			{ key: 'trash', label: 'Trash', icon: <DeleteOutlined /> },
		],
	},
	{
		type: 'divider',
	},
	{ key: 'settings', label: 'Settings', icon: <SettingOutlined /> },
	{ key: 'feedback', label: 'Send feedback', icon: <QuestionCircleOutlined /> },
];

const Sidebar = ({ user, loadingUser, onLogin, onLogout }) => {
	const isAuthenticated = Boolean(user);
	const profileAccent = 'rgba(138, 131, 255, 0.3)';

	const handleAuthClick = () => {
		if (isAuthenticated) {
			onLogout?.();
		} else {
			onLogin?.();
		}
	};

	// Use Ant Design's Dark Algorithm for automatic dark mode styling
	return (
		<ConfigProvider
			theme={{
				algorithm: theme.darkAlgorithm,
				token: {
					colorPrimary: '#6b7280', // Adjust selection color (greyish)
					colorBgContainer: '#1f1f1f',
				},
				components: {
					Menu: {
						itemSelectedBg: '#333333', // Dark grey background for selected item
						itemSelectedColor: '#ffffff', // White text for selected item
						itemHeight: 40,
						itemMarginInline: 8, // Spacing for the rounded look
					}
				}
			}}
		>
			<div
				style={{
					width: '100%',
					height: '100vh',
					background: '#141414', // Main background
					display: 'flex',
					flexDirection: 'column',
					borderRight: '1px solid #303030',
				}}
			>
				{/* --- 1. HEADER (User Profile) --- */}
				<div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
					<div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', flex: 1 }}>
						<Avatar
							src={user?.photo || defaultAvatar}
							size="small"
							shape="square"
						/>
						<div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
							<Text
								strong
								style={{
									color: '#fff',
									padding: '2px 8px',
									borderRadius: 999,
									background: isAuthenticated ? profileAccent : 'transparent',
									boxShadow: isAuthenticated ? '0 0 10px rgba(138, 131, 255, 0.7)' : 'none',
								}}
							>
								{user?.displayName || 'Guest'}
							</Text>
							<Text style={{ color: '#8c8c8c', fontSize: 11 }}>
								{user?.email || 'Sign in to link Gmail'}
							</Text>
						</div>
					</div>
					<div style={{ display: 'flex', gap: 8 }}>
						<Button
							type={isAuthenticated ? 'default' : 'primary'}
							size="small"
							loading={!isAuthenticated && loadingUser}
							onClick={handleAuthClick}
						>
							{isAuthenticated ? 'Logout' : 'Sign in'}
						</Button>
						<Button type="text" icon={<EditOutlined />} style={{ color: '#fff' }} />
					</div>
				</div>

				{/* --- 2. SEARCH BAR --- */}
				<div style={{ padding: '0 12px 16px 12px' }}>
					<Input
						placeholder="Search"
						prefix={<SearchOutlined style={{ color: '#666' }} />}
						bordered={true}
						style={{ backgroundColor: 'transparent', color: '#fff' }}
					/>
				</div>

				{/* --- 3. MENU (Scrollable Area) --- */}
				<div style={{ flex: 1, overflowY: 'auto' }}>
					<Menu
						mode="inline"
						defaultSelectedKeys={['all']} // Select "All Mail" by default
						style={{ borderRight: 0, background: 'transparent' }}
						items={items}
					/>
				</div>

				{/* --- 4. FOOTER --- */}
				<div style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #303030' }}>
					<div style={{ display: 'flex', gap: '16px' }}>
					</div>
					<Button shape="circle" icon={<QuestionCircleOutlined />} />
				</div>
			</div>
		</ConfigProvider>
	);
};

export default Sidebar;
