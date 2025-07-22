'use client';

import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';

export default function CharacterInfoPage() {
    const [characterName, setCharacterName] = useState('');
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchData = async () => {
        if (!characterName) return;

        setLoading(true);
        setError(null);
        setData(null);

        try {
            const response = await fetch(`https://developer-lostark.game.onstove.com/characters/${characterName}/siblings`, {
                headers: {
                    'Authorization': 'bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1dCI6IktYMk40TkRDSTJ5NTA5NWpjTWk5TllqY2lyZyIsImtpZCI6IktYMk40TkRDSTJ5NTA5NWpjTWk5TllqY2lyZyJ9.eyJpc3MiOiJodHRwczovL2x1ZHkuZ2FtZS5vbnN0b3ZlLmNvbSIsImF1ZCI6Imh0dHBzOi8vbHVkeS5nYW1lLm9uc3RvdmUuY29tL3Jlc291cmNlcyIsImNsaWVudF9pZCI6IjEwMDAwMDAwMDAwMDExNTIifQ.PUF70zE_m-9vTT_vRQ0TTuDWsulxRss9ZrW8wSUnGsds65C6NgD-qCmSv45XAuoU0NyJXjmttsbDEf-_-Y8x7im7ycVeooqXJLJXIdZ8ukkJZtm_-0S-WodhcVV7UYj9dvXdTWLyYWmY-y4q2HIIouE6ohPFtcESariEztQ3muVqF2i0FLFfiPN6KEnbJqVr6XO4XMY1HOQszKATOG0Npb0v0JItBdEwYrudbkxQwF5fd3tct6_v56m_eMo8HkRjka0BeKTShDR7q0MKSd1GXBnrJ9JXOhKMC9kqGqD08YEkR2Nrr2jWsF7E3mHhxUSNZYppcN6G87wj6UnEs5ySpw'
                }
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const result = await response.json();
            setData(result);
        } catch (e: any) {
            setError(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout>
            <h1>Character Info</h1>
            <div className="mb-3 d-flex">
                <input
                    type="text"
                    className="form-control me-2"
                    value={characterName}
                    onChange={(e) => setCharacterName(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            fetchData();
                        }
                    }}
                    placeholder="Enter character name"
                />
                <button className="btn btn-primary" onClick={fetchData}>Search</button>
            </div>

            {loading && <p>Loading character data...</p>}
            {error && <p>Error: {error.message}</p>}
            {data && (
                <>
                    <h2>API Data:</h2>
                    <pre>{JSON.stringify(data, null, 2)}</pre>
                </>
            )}
        </Layout>
    );
}
