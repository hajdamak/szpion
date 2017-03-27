import React from 'react';

import styles from '../styles/index.scss';

import Recipe from './recipe.jsx';
import List from './list.jsx';
import Bootstrap from 'bootstrap/dist/css/bootstrap.css';
import { Grid, Row, Col } from 'react-bootstrap';

export default class App extends React.Component {

  render() {
    return (
    	<div className={styles.redBorder}>

			<h1>Recipes</h1>
			<p>This React project just works including <span className={styles.redBg}>module</span> local styles.</p>
			<Grid>
				<Row className="show-grid">
					<Col xs={2} md={2}>
						<List src="recipes/list.md" />
					</Col>
					<Col xs={10} md={10}>
						<Recipe src="recipes/ramen.md" />
					</Col>
				</Row>
			</Grid>

			</div>
    )
  }
}
