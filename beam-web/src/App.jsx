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
	const [messages, setMessages] = useState([]);
	const [labels, setLabels] = useState([]);
	const [mailboxLoading, setMailboxLoading] = useState(false);
	const [mailboxError, setMailboxError] = useState(null);
	const [syncingMailbox, setSyncingMailbox] = useState(false);

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

	const loadMailboxData = useCallback(async () => {
		if (!user) return;
		setMailboxLoading(true);
		setMailboxError(null);
		try {
			const [messagesResponse, labelsResponse] = await Promise.all([
				fetch('/api/gmail/messages?limit=100', { credentials: 'include' }),
				fetch('/api/gmail/labels', { credentials: 'include' }),
			]);

			if (!messagesResponse.ok) {
				throw new Error('Failed to load Gmail messages');
			}
			if (!labelsResponse.ok) {
				throw new Error('Failed to load Gmail labels');
			}

			const messagesPayload = await messagesResponse.json();
			const labelsPayload = await labelsResponse.json();

			setMessages(messagesPayload.messages || []);
			setLabels(labelsPayload.labels || []);
		} catch (error) {
			console.error(error);
			setMailboxError(error.message || 'Unable to load mailbox');
		} finally {
			setMailboxLoading(false);
		}
	}, [user]);

	const syncMailbox = useCallback(
		async ({ forceFull = false } = {}) => {
			if (!user) return;
			setSyncingMailbox(true);
			try {
				const response = await fetch('/api/gmail/sync', {
					method: 'POST',
					credentials: 'include',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(forceFull ? { mode: 'full' } : {}),
				});
				if (!response.ok) {
					throw new Error('Failed to synchronize Gmail');
				}
				await loadMailboxData();
			} catch (error) {
				console.error(error);
				setMailboxError(error.message || 'Unable to synchronize mailbox');
			} finally {
				setSyncingMailbox(false);
			}
		},
		[user, loadMailboxData],
	);

	useEffect(() => {
		if (!user) {
			setMessages([]);
			setLabels([]);
			setMailboxError(null);
			return;
		}
		loadMailboxData();
	}, [user, loadMailboxData]);

	useEffect(() => {
		if (user) {
			syncMailbox({ forceFull: true }).catch(() => {});
		}
	}, [user, syncMailbox]);

	return (
		<Flex gap="middle" wrap>
			<Layout style={layoutStyle}>
				<Sider width="225px" style={siderStyle}>
					<SideBar
						user={user}
						loadingUser={loadingUser}
						labels={labels}
						onSync={() => syncMailbox()}
						syncing={syncingMailbox}
						onLogin={handleLogin}
						onLogout={handleLogout}
					/>
				</Sider>
				<Layout>
					<Content style={contentStyle}>
						<MailRow
							user={user}
							messages={messages}
							labels={labels}
							loading={mailboxLoading || syncingMailbox}
							error={mailboxError}
							onRefresh={() => syncMailbox()}
						/>
					</Content>
				</Layout>
			</Layout>
		</Flex>
	);
};

export default App;
