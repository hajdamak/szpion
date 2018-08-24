// import React from 'react';
//
// //import './styles/index.scss';
//
// import { readableDuration } from './utils';
//
// export default class TimeTable extends React.Component {
// 	constructor(props) {
// 		super(props);
// 	}
//
// 	render() {
// 		return (
// 			<table className="table is-striped is-narrow is-fullwidth">
// 				<thead>
// 				<tr>
// 					<th>Who</th>
// 					<th>Time spent</th>
// 				</tr>
// 				</thead>
// 				<tbody>
// 				{Object.keys(this.props.summary).map( key =>
// 					<tr key={ key }>
// 						<td className={ `user-${key} col-md-1`}>{ this.props.summary[key].displayName }</td>
// 						<td className={ `user-${key} col-md-6`}>{ readableDuration(this.props.summary[key].sum) }</td>
// 					</tr>
// 				)}
//
// 				</tbody>
// 			</table>
// 		)
// 	}
// }
//
