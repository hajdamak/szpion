import styles from '../styles/index.scss';

import React from 'react';
// import MarkdownIt from 'markdown-it';
import 'whatwg-fetch';

export default class List extends React.Component {

	constructor(props) {
		super(props);
		this.state =  {
			list: ""
		};
	}

	acomponentDidMount() {

		let md = new MarkdownIt();

		fetch("../../" + this.props.src)
			.then(
				response => response.text()
			).then(
			body => {
				let html = md.render(body);
				this.setState({
					list: html
				});
			}
		)
	}

	render() {
		return (
			<div dangerouslySetInnerHTML={{ __html: this.state.list }}></div>
		)
	}

}
