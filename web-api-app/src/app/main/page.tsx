'use client';

import { useEffect, useState, useMemo } from 'react';
import { API_BASE_URL, API_AUTH_TOKEN } from '../../config/api';
import Layout from '../../components/Layout';

export default function MainPage() {
	const names = useMemo(() => ["다시시작하는창술사", "내가왜가", "소라민", "윤제리", "원딜장인재승리", "럭차차", "함말뚝"], []);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchCharacterArmories = async () => {
			const headers = {
				'Authorization': API_AUTH_TOKEN
			};

			for (const name of names) {
				try {
					const response = await fetch(`${API_BASE_URL}/armories/characters/${name}`, {
						headers: headers
					});
					if (!response.ok) {
						throw new Error(`HTTP error! status: ${response.status}`);
					}
					const data = await response.json();
					console.log(`Armory data for ${name}:`, data);
				} catch (error) {
					console.error(`Error fetching armory data for ${name}:`, error);
				}
			}
			setLoading(false); // All fetches completed
		};

		fetchCharacterArmories();
	}, [names]);

	return (
		<Layout>
			<div className="container-fluid">
				<div className="row">
					<div className="col-md-9">
						<h1>Welcome to the Main Page!</h1>
						<p>This is your new main page.</p>
						{loading && <p>Loading character armories...</p>}
					</div>
					<div className="col-md-3">
						<div className="card shadow-sm rounded">
							<div className="card-body">
								<h5 className="card-title">Character Names</h5>
								<ul className="list-unstyled">
									{names.map((name, index) => (
										<li key={index}>{name}</li>
									))}
								</ul>
							</div>
						</div>
					</div>
				</div>
			</div>
		</Layout>
	);
}
