import React from 'react';
import { Flex, Layout } from 'antd';

import SideBar from './components/layout/Sidebar.jsx';
import MailRow from './components/mail/MailRow.jsx';

const { Header, Sider, Content } = Layout;
const headerStyle = {
	textAlign: 'center',
	color: '#fff',
	height: 64,
	paddingInline: 48,
	lineHeight: '64px',
};
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
	height: "100vh",
	overflow: 'hidden',
	width: 'calc(100%)',
	maxWidth: 'calc(100%)',
};
const App = () => (
	<Flex gap="middle" wrap>
		<Layout style={layoutStyle}>
			<Sider width="225px" style={siderStyle}>
				<SideBar />
			</Sider>
			<Layout>
				<Header style={headerStyle}>Header</Header>
				<Content style={contentStyle}>
					<MailRow />
				</Content>
			</Layout>
		</Layout>
	</Flex>
);
export default App;