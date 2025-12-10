import React, { useEffect, useState, useCallback } from 'react';
import { Layout, Grid, Row, Col } from 'antd';

import SideBar from './components/layout/Sidebar.jsx';
import MailRow from './components/mail/MailRow.jsx';

const { Content } = Layout;

const SYSTEM_LABEL_MAP = {
	sent: 'SENT',
	drafts: 'DRAFT',
	spam: 'SPAM',
	trash: 'TRASH',
};

const App = () => {
	const [user, setUser] = useState(null);
	const [loadingUser, setLoadingUser] = useState(false);
	const [messages, setMessages] = useState([]);
	const [labels, setLabels] = useState([]);
	const [mailboxLoading, setMailboxLoading] = useState(false);
	const [mailboxError, setMailboxError] = useState(null);
	const [syncingMailbox, setSyncingMailbox] = useState(false);
	const [selectedMenuKey, setSelectedMenuKey] = useState('all');
	const [activeLabelId, setActiveLabelId] = useState(null);
	const [page, setPage] = useState(1);
	const [pageSize] = useState(50);
	const [totalMessages, setTotalMessages] = useState(0);

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
		if (!user) return false;
		setMailboxLoading(true);
		setMailboxError(null);
		try {
			const params = new URLSearchParams({
				limit: String(pageSize),
				page: String(page),
			});
			if (activeLabelId) {
				params.set('labelId', activeLabelId);
			}

			const [messagesResponse, labelsResponse] = await Promise.all([
				fetch(`/api/gmail/messages?${params.toString()}`, { credentials: 'include' }),
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

			const total = messagesPayload.total ?? 0;
			setTotalMessages(total);
			setLabels(labelsPayload.labels || []);

			const maxPage = total ? Math.max(1, Math.ceil(total / pageSize)) : 1;
			if (page > maxPage) {
				setPage(maxPage);
			}

			setMessages(messagesPayload.messages || []);
			return Boolean(messagesPayload.messages?.length);
		} catch (error) {
			console.error(error);
			setMailboxError(error.message || 'Unable to load mailbox');
			return false;
		} finally {
			setMailboxLoading(false);
		}
	}, [user, page, pageSize, activeLabelId]);

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
			setSelectedMenuKey('all');
			setActiveLabelId(null);
			setPage(1);
			setTotalMessages(0);
			return;
		}
		let cancelled = false;
		const hydrate = async () => {
			const hasData = await loadMailboxData();
			if (!hasData && !cancelled) {
				syncMailbox({ forceFull: true }).catch(() => { });
			}
		};
		hydrate();
		return () => {
			cancelled = true;
		};
	}, [user, loadMailboxData, syncMailbox]);

	const handleMenuSelect = useCallback((key) => {
		setSelectedMenuKey(key);
		setPage(1);
		if (key === 'all') {
			setActiveLabelId(null);
			return;
		}

		if (key.startsWith('label-')) {
			setActiveLabelId(key.replace('label-', ''));
			return;
		}

		const systemLabel = SYSTEM_LABEL_MAP[key];
		setActiveLabelId(systemLabel || null);
	}, []);

	const handlePageChange = useCallback((nextPage) => {
		setPage(prev => {
			if (nextPage < 1) return 1;
			if (nextPage === prev) return prev;
			return nextPage;
		});
	}, []);

	const screens = Grid.useBreakpoint();
	const padding = screens.md ? 24 : 12;
	const gutter = screens.sm ? 16 : 12;
	const sidebarSpans = { xs: 24, sm: 24, md: 8, lg: 7, xl: 6, xxl: 5 };
	const contentSpans = { xs: 24, sm: 24, md: 16, lg: 17, xl: 18, xxl: 19 };

	return (
		<Layout
			style={{
				minHeight: '100vh',
				padding,
				background: 'transparent',
			}}
		>
			<Row
				gutter={[gutter, gutter]}
				align="stretch"
				style={{
					width: '100%',
					margin: 0,
				}}
			>
				<Col {...sidebarSpans} style={{ display: 'flex' }}>
					<SideBar
						user={user}
						loadingUser={loadingUser}
						labels={labels}
						selectedKey={selectedMenuKey}
						onMenuSelect={handleMenuSelect}
						onSync={() => syncMailbox()}
						syncing={syncingMailbox}
						onLogin={handleLogin}
						onLogout={handleLogout}
					/>
				</Col>
				<Col {...contentSpans} style={{ display: 'flex' }}>
					<Content
						style={{
							width: '100%',
							padding: 0,
							background: 'transparent',
						}}
					>
						<MailRow
							user={user}
							messages={messages}
							labels={labels}
							activeLabelId={activeLabelId}
							page={page}
							pageSize={pageSize}
							total={totalMessages}
							loading={mailboxLoading || syncingMailbox}
							error={mailboxError}
							onPageChange={handlePageChange}
							onRefresh={() => syncMailbox()}
						/>
					</Content>
				</Col>
			</Row>
		</Layout>
	);
};

export default App;
