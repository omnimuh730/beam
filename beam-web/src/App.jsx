import React, { useEffect, useState, useCallback } from 'react';
import { Flex, Layout } from 'antd';

import SideBar from './components/layout/Sidebar.jsx';
import MailRow from './components/mail/MailRow.jsx';

const { Sider, Content } = Layout;
const contentStyle = {
	textAlign: 'center',
	height: '100%',
	lineHeight: '120px',
	color: '#fff',
};
const siderStyle = {
	textAlign: 'center',
	lineHeight: '100%',
	color: '#fff',
};
const layoutStyle = {
	borderRadius: 8,
	height: '100vh',
	overflow: 'hidden',
	width: 'calc(100%)',
	maxWidth: 'calc(100%)',
};

const App = () => {
	const [user, setUser] = useState(null);
	const [loadingUser, setLoadingUser] = useState(false);

	const fetchCurrentUser = useCallback(async () => {
		setLoadingUser(true);
		try {
			const response = await fetch('/api/auth/me', {
				credentials: 'include',
			});
			if (!response.ok) throw new Error('Not authenticated');
			const payload = await response.json();
			if (payload.authenticated) {
				setUser(payload.user);
			} else {
				setUser(null);
			}
		} catch (_error) {
			setUser(null);
		} finally {
			setLoadingUser(false);
		}
	}, []);

	useEffect(() => {
		fetchCurrentUser();
	}, [fetchCurrentUser]);

	const handleLogin = () => {
		window.location.href = '/api/auth/google';
	};

	const handleLogout = async () => {
		await fetch('/api/auth/logout', {
			method: 'POST',
			credentials: 'include',
		});
		setUser(null);
	};

	return (
		<Flex gap="middle" wrap>
			<Layout style={layoutStyle}>
				<Sider width="225px" style={siderStyle}>
					<SideBar
						user={user}
						loadingUser={loadingUser}
						onLogin={handleLogin}
						onLogout={handleLogout}
					/>
				</Sider>
				<Layout>
					<Content style={contentStyle}>
						<MailRow user={user} />
					</Content>
				</Layout>
			</Layout>
		</Flex>
	);
};

export default App;
