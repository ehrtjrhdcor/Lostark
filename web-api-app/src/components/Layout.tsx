'use client';

import Topbar from './Topbar';
import Sidebar from './Sidebar';
import { Container, Row, Col } from 'react-bootstrap';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Topbar />
      <Container fluid>
        <Row>
          <Col xs={2} id="sidebar-wrapper">
            <Sidebar />
          </Col>
          <Col xs={10} id="page-content-wrapper">
            {children}
          </Col>
        </Row>
      </Container>
    </>
  );
}
