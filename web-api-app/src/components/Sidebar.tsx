'use client';

import { Nav } from 'react-bootstrap';

export default function Sidebar() {
  return (
    <Nav className="col-md-12 d-none d-md-block bg-light sidebar"
      activeKey="/home"
      onSelect={selectedKey => alert(`selected ${selectedKey}`)} // Placeholder for actual navigation
    >
      <div className="sidebar-sticky"></div>
      <Nav.Item>
        <Nav.Link href="/main">Home</Nav.Link>
      </Nav.Item>
      <Nav.Item>
        <Nav.Link href="/character_info">Character Info</Nav.Link>
      </Nav.Item>
      <Nav.Item>
        <Nav.Link eventKey="link-2">Link</Nav.Link>
      </Nav.Item>
      <Nav.Item>
        <Nav.Link eventKey="disabled" disabled>
          Disabled
        </Nav.Link>
      </Nav.Item>
    </Nav>
  );
}
