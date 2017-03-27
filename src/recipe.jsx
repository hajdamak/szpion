import styles from '../styles/index.scss';

import React from 'react';
// import MarkdownIt from 'markdown-it';
import 'whatwg-fetch';
import { Table } from 'react-bootstrap';
// import $ from 'jquery';

export default class Recipe extends React.Component {

	constructor(props) {
		super(props);
		this.state =  {
			recipe: "",
			headerHtml: "",
			stepsHtml: "",
			notesHtml: ""
		};
	}

	acomponentDidMount() {

		let md = new MarkdownIt();

		fetch("../../" + this.props.src)
			.then(
				response => response.text()
			).then(
				body => {
					console.log("Markdown recipe : " + body);

					// Transform Markdown to HTML
					let html = md.render(body);
					console.log("HTML recipe : " + html);

					// Parse HTML
					let doc = $("<div>" + html + "</div>");
					let result = doc.html();

					// Get header
					let headerHtml =
						doc.find("h1").nextUntil("h2:contains('Kroki'), h2:contains('Steps')").addBack().map(
							(index, element) => $(element)[0].outerHTML
						).get().reduce(
							(resultHTML, elementHTML) => resultHTML + elementHTML
						)
					console.log("Header : " + headerHtml);

					// Get steps
					let stepsHtml =
						doc.find("h2:contains('Kroki'), h2:contains('Steps')")
							.nextUntil("h2:contains('Uwagi'), h2:contains('Notes')").filter("h3").map(
								(index, element) => {

									let group = $(element).nextUntil("h3, h2");

									let groupStepsHtml =  $(element).get(0).outerHTML + " " + group.filter("ol").get(0).outerHTML;

									let groupIngredients = group.filter("ul").first().children().filter("li");

									return groupIngredients.map(
										(index, element) => {

											let ingredient = $(element).get(0).innerHTML.toString();

											// var rx = /^(.*)\\(.*)\\(.*)$/g;
											// var arr = rx.exec( ingredient );
											// console.log(" Regexp : " + arr[0]);
											// console.log(" Regexp : " + arr[1]);
											// console.log(" Regexp : " + arr[2]);

											let result = "<tr>" +
												"<td>" + $(element).get(0).innerHTML + "</td>" +
												"<td></td>" +
												"<td></td>" +
												"<td></td>";

									  	  if (index == 0) result += "<td rowspan='" + groupIngredients.length  + "'>" + groupStepsHtml + "</td>";

									  	  result += "</tr>";

												return result;
										}

									).get().reduce(
										(resultHTML, elementHTML) => resultHTML + elementHTML
									);

								}
							).get().reduce(
								(resultHTML, elementHTML) => resultHTML + elementHTML
							)
					console.log("Steps : " + stepsHtml);

					// Get notes
					let notesHtml =
						doc.find("h2:contains('Uwagi'), h2:contains('Notes')").nextAll().addBack().map(
							(index, element) => $(element)[0].outerHTML
						).get().reduce(
							(resultHTML, elementHTML) => resultHTML + elementHTML
						)
					console.log("Notes : " + notesHtml);

					//console.log("Target HTML recipe : " + header.html());

					this.setState({
						recipe: result,
						headerHtml: headerHtml,
						stepsHtml: stepsHtml,
						notesHtml: notesHtml
					});
				}
			)
	}

	render() {
		return (
			<div>

				<div dangerouslySetInnerHTML={{ __html: this.state.headerHtml }}></div>

				<Table responsive>
					<thead><tr>
						<th>Składnik</th>
						<th>Waga</th>
						<th>Ilość*</th>
						<th>Skala</th>
						<th>Kroki</th>
					</tr></thead>
					<tbody  dangerouslySetInnerHTML={{ __html: this.state.stepsHtml }}></tbody>
				</Table>

				<div dangerouslySetInnerHTML={{ __html: this.state.notesHtml }}></div>

			</div>
		)
	}
}
