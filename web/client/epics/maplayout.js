/*
 * Copyright 2017, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/
const Rx = require('rxjs');
const {updateMapLayout} = require('../actions/maplayout');
const {TOGGLE_CONTROL, SET_CONTROL_PROPERTY} = require('../actions/controls');
const {MAP_CONFIG_LOADED} = require('../actions/config');
const {SIZE_CHANGE, CLOSE_FEATURE_GRID, OPEN_FEATURE_GRID} = require('../actions/featuregrid');
const {CLOSE_IDENTIFY, ERROR_FEATURE_INFO, TOGGLE_MAPINFO_STATE, LOAD_FEATURE_INFO, EXCEPTIONS_FEATURE_INFO} = require('../actions/mapInfo');
const {SHOW_SETTINGS, HIDE_SETTINGS} = require('../actions/layers');
const {mapInfoRequestsSelector} = require('../selectors/mapinfo');

/**
 * Epìcs for feature grid
 * @memberof epics
 * @name mapLayout
 */

const {head, get} = require('lodash');
const {isFeatureGridOpen, getDockSize} = require('../selectors/featuregrid');

/**
 * Gets `MAP_CONFIG_LOADED`, `SIZE_CHANGE`, `CLOSE_FEATURE_GRID`, `OPEN_FEATURE_GRID`, `CLOSE_IDENTIFY`, `LOAD_FEATURE_INFO`, `TOGGLE_MAPINFO_STATE`, `TOGGLE_CONTROL`, `SET_CONTROL_PROPERTY` events.
 * Configures a map layout based on state of panels.
 * @param {external:Observable} action$ manages `MAP_CONFIG_LOADED`, `SIZE_CHANGE`, `CLOSE_FEATURE_GRID`, `OPEN_FEATURE_GRID`, `CLOSE_IDENTIFY`, `LOAD_FEATURE_INFO`, `TOGGLE_MAPINFO_STATE`, `TOGGLE_CONTROL`, `SET_CONTROL_PROPERTY`.
 * @memberof epics.mapLayout
 * @return {external:Observable} emitting {@link #actions.map.updateMapLayout} action
 */

const updateMapLayoutEpic = (action$, store) =>
    action$.ofType(MAP_CONFIG_LOADED, SIZE_CHANGE, CLOSE_FEATURE_GRID, OPEN_FEATURE_GRID, CLOSE_IDENTIFY, TOGGLE_MAPINFO_STATE, LOAD_FEATURE_INFO, EXCEPTIONS_FEATURE_INFO, TOGGLE_CONTROL, SET_CONTROL_PROPERTY, SHOW_SETTINGS, HIDE_SETTINGS, ERROR_FEATURE_INFO)
        .switchMap(() => {

            const state = store.getState();

            if (get(state, "browser.mobile")) {
                const bottom = mapInfoRequestsSelector(state).length > 0 ? {bottom: '50%'} : {bottom: undefined};
                const boundingMapRect = {
                    ...bottom
                };
                return Rx.Observable.of(updateMapLayout({
                    boundingMapRect
                }));
            }

            const mapLayout = {left: {sm: 300, md: 500, lg: 600}, right: {md: 658}, bottom: {sm: 30}};

            if (get(state, "mode") === 'embedded') {
                const height = {height: 'calc(100% - ' + mapLayout.bottom.sm + 'px)'};
                const bottom = mapInfoRequestsSelector(state).length > 0 ? {bottom: '50%'} : {bottom: undefined};
                const boundingMapRect = {
                    ...bottom
                };
                return Rx.Observable.of(updateMapLayout({
                    ...height,
                    boundingMapRect
                }));
            }

            const leftPanels = head([
                get(state, "controls.queryPanel.enabled") && {left: mapLayout.left.lg} || null,
                get(state, "controls.widgetBuilder.enabled") && {left: mapLayout.left.md} || null,
                get(state, "layers.settings.expanded") && {left: mapLayout.left.md} || null,
                get(state, "controls.drawer.enabled") && {left: mapLayout.left.sm} || null
            ].filter(panel => panel)) || {left: 0};

            const rightPanels = head([
                get(state, "controls.details.enabled") && {right: mapLayout.right.md} || null,
                get(state, "controls.annotations.enabled") && {right: mapLayout.right.md} || null,
                get(state, "controls.metadataexplorer.enabled") && {right: mapLayout.right.md} || null,
                get(state, "mapInfo.enabled") && mapInfoRequestsSelector(state).length > 0 && {right: mapLayout.right.md} || null
            ].filter(panel => panel)) || {right: 0};

            const dockSize = getDockSize(state) * 100;
            const bottom = isFeatureGridOpen(state) && {bottom: dockSize + '%', dockSize} || {bottom: mapLayout.bottom.sm};

            const transform = isFeatureGridOpen(state) && {transform: 'translate(0, -' + mapLayout.bottom.sm + 'px)'} || {transform: 'none'};
            const height = {height: 'calc(100% - ' + mapLayout.bottom.sm + 'px)'};

            const boundingMapRect = {
                ...bottom,
                ...leftPanels,
                ...rightPanels
            };

            return Rx.Observable.of(updateMapLayout({
                ...leftPanels,
                ...rightPanels,
                ...bottom,
                ...transform,
                ...height,
                boundingMapRect
            }));
        });

module.exports = {
    updateMapLayoutEpic
};
