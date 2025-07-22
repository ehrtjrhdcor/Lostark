'use client';

import Image from 'next/image';
import { useState } from 'react';
import { API_BASE_URL, API_AUTH_TOKEN } from '../../config/api';
import Layout from '../../components/Layout';

interface CharacterData {
    CharacterName: string;
    ServerName: string;
    CharacterLevel: string;
    CharacterClassName: string;
    ItemAvgLevel: string;
}


export default function CharacterInfoPage() {
    const [characterName, setCharacterName] = useState('');
    const [data, setData] = useState<CharacterData[] | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchData = async () => {
        if (!characterName) return;

        setLoading(true);
        setError(null);
        setData(null);

        try {
            const response = await fetch(`${API_BASE_URL}/characters/${characterName}/siblings`, {
                headers: {
                    'Authorization': API_AUTH_TOKEN
                }
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const result = await response.json();
            console.log('API Response:', result);

            if (result && Array.isArray(result)) {
                const sortedData = [...result].sort((a, b) => {
                    const levelA = parseFloat(a.ItemAvgLevel.replace(/,/g, ''));
                    const levelB = parseFloat(b.ItemAvgLevel.replace(/,/g, ''));
                    return levelB - levelA; // 역순 정렬
                });
                setData(sortedData);
            } else {
                setData(result);
            }
        } catch (e: unknown) {
            setError(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout>
            <h1>Character Info</h1>
            <div>
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
            </div>

            {loading && <p>Loading character data...</p>}
            {error && <p>Error: {error.message}</p>}
            {data && Array.isArray(data) && data.length > 0 ? (
                <>
                    <h2>Character List:</h2>
                    <div className="row">
                        {data.map((character: CharacterData, index: number) => (
                            <div key={index} className="col-md-6 mb-3">
                                <div className="card shadow-sm rounded">
                                    <div className="card-body">
                                        <div className="row">
                                            <div className="col-8">
                                                <h5 className="card-title">{character.CharacterName}</h5>
                                                <p className="card-text mb-1"><strong>Server:</strong> {character.ServerName}</p>
                                                <p className="card-text mb-1"><strong>Level:</strong> {character.CharacterLevel}</p>
                                                <p className="card-text mb-1"><strong>Class:</strong> {character.CharacterClassName}</p>
                                                <p className="card-text mb-0"><strong>Item Avg Level:</strong> {character.ItemAvgLevel}</p>
                                            </div>
                                            <div className="col-4 d-flex align-items-center justify-content-center">
                                                {/* Placeholder for image */}
                                                <Image src="https://via.placeholder.com/100" alt="Character Image" className="img-fluid rounded" width={100} height={100} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            ) : (
                data && <p>Character not found.</p>
            )}
        </Layout>
    );
}