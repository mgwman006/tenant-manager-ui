import { Typography,Layout, Image, Grid, Drawer, Button, Card, Row, Divider, Col, Space, Tag, Flex, Menu, Breadcrumb, Avatar } from 'antd';
import { HomeFilled, HomeOutlined, MenuOutlined } from '@ant-design/icons';
import { Outlet } from 'react-router-dom';
import { useState } from 'react';
import Sider from 'antd/es/layout/Sider';

const { Title, Text, Link } = Typography;

const { Header, Footer, Content } = Layout;
const { useBreakpoint } = Grid;

const navItems = [
  { 
    key: 'home', 
    label: <Link href='/'>
            <Avatar icon={<HomeFilled />} /> Home
          </Link>, 
    to: '/' 
  },
];

export default function AppLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const screens = useBreakpoint();
  const isMobile = !screens.md; // <768px = mobile

  return (
    <Layout>
      <Header 
          style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          width: '100%',
          padding: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#0F172A',
          height: 64,
        }}
        >
        <div style={{
          background: '#fff',
          height: 64,
          display: 'flex',
          alignItems: 'center',
          padding: '0 16px',
          flexShrink: 0,
        }}>
          <Image
            preview={false}
            src="/tante-logo.svg"
            width={96}          // fixed px — never grows
            height={29}         // keeps aspect ratio locked
            style={{ display: 'block' }}
          />
        </div>
        <Menu
          theme="dark"
          mode="horizontal"
          defaultSelectedKeys={['2']}
          // items={items1}
          style={{ flex: 1, minWidth: 0 }}
        />
      </Header>
      <Layout>
        <Sider 
          breakpoint="lg"
          collapsedWidth="0"
          style={{
            position: 'sticky',
            top: 64,
            height: 'calc(100vh - 64px)',
            overflow: 'auto',
          }}
          onBreakpoint={(broken) => {
            console.log(broken);
          }}
          onCollapse={(collapsed, type) => {
            console.log(collapsed, type);
          }}
        >
          <Menu
            mode="inline"
            defaultSelectedKeys={['1']}
            defaultOpenKeys={['sub1']}
            style={{ height: '100%', borderInlineEnd: 0 }}
            items={navItems}
          />
        </Sider>
        <Layout style={{ padding: '0 24px 24px' }}>
          <Content>
            <Outlet />
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
}