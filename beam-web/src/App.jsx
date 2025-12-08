import React from 'react';
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
				<Content style={contentStyle}>
					<MailRow />
				</Content>
			</Layout>
		</Layout>
	</Flex>
);
export default App;