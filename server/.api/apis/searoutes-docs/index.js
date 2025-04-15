"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var oas_1 = __importDefault(require("oas"));
var core_1 = __importDefault(require("api/dist/core"));
var openapi_json_1 = __importDefault(require("./openapi.json"));
var SDK = /** @class */ (function () {
    function SDK() {
        this.spec = oas_1.default.init(openapi_json_1.default);
        this.core = new core_1.default(this.spec, 'searoutes-docs/2.10.0 (api/6.1.3)');
    }
    /**
     * Optionally configure various options that the SDK allows.
     *
     * @param config Object of supported SDK options and toggles.
     * @param config.timeout Override the default `fetch` request timeout of 30 seconds. This number
     * should be represented in milliseconds.
     */
    SDK.prototype.config = function (config) {
        this.core.setConfig(config);
    };
    /**
     * If the API you're using requires authentication you can supply the required credentials
     * through this method and the library will magically determine how they should be used
     * within your API request.
     *
     * With the exception of OpenID and MutualTLS, it supports all forms of authentication
     * supported by the OpenAPI specification.
     *
     * @example <caption>HTTP Basic auth</caption>
     * sdk.auth('username', 'password');
     *
     * @example <caption>Bearer tokens (HTTP or OAuth 2)</caption>
     * sdk.auth('myBearerToken');
     *
     * @example <caption>API Keys</caption>
     * sdk.auth('myApiKey');
     *
     * @see {@link https://spec.openapis.org/oas/v3.0.3#fixed-fields-22}
     * @see {@link https://spec.openapis.org/oas/v3.1.0#fixed-fields-22}
     * @param values Your auth credentials for the API; can specify up to two strings or numbers.
     */
    SDK.prototype.auth = function () {
        var _a;
        var values = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            values[_i] = arguments[_i];
        }
        (_a = this.core).setAuth.apply(_a, values);
        return this;
    };
    /**
     * If the API you're using offers alternate server URLs, and server variables, you can tell
     * the SDK which one to use with this method. To use it you can supply either one of the
     * server URLs that are contained within the OpenAPI definition (along with any server
     * variables), or you can pass it a fully qualified URL to use (that may or may not exist
     * within the OpenAPI definition).
     *
     * @example <caption>Server URL with server variables</caption>
     * sdk.server('https://{region}.api.example.com/{basePath}', {
     *   name: 'eu',
     *   basePath: 'v14',
     * });
     *
     * @example <caption>Fully qualified server URL</caption>
     * sdk.server('https://eu.api.example.com/v14');
     *
     * @param url Server URL
     * @param variables An object of variables to replace into the server URL.
     */
    SDK.prototype.server = function (url, variables) {
        if (variables === void 0) { variables = {}; }
        this.core.setServer(url, variables);
    };
    /**
     * This endpoints returns the route between a source location and a target location on sea,
     * along with the route distance (in meters), duration (in milliseconds) and the crossed
     * areas. We return the shortest route sailed considering traffic separation schemes and
     * port entries.
     *
     * ### Locations: origin, destination and waypoints
     *
     * Locations can be specified as coordinate pairs or UN/LOCODEs. Coordinate pairs are
     * formatted as `longitude,latitude`. Each position should be separated by semicolons `;`.
     * You can add up to 20 positions, including waypoints on a route (up to 18), or request
     * several legs of a trip in one go by listing more than two positions. For instance:
     * `-1.26617431640625,50.79551936692376;8.8330078125,53.88491634606499;-3.2409667968749996,53.50111704294316`.
     *
     * ### Vessel specific routes
     *
     * You can get vessel specific routes by specifying the IMO number of a vessel. The
     * returned route will be compatible with the vessel dimensions (width (in m), length (in
     * m), maximum draft (in m)). If the IMO is not given, We choose a small vessel in order
     * not to block any route.
     * You can also specify the current draft (in m) of the vessel using the parameter
     * `vesselDraft`, with or without giving an IMO. If both IMO and vessel draft are given,
     * the given draft (in m) is used and the other dimensions (width, length) are retrieved
     * from the IMO number.
     * The response contains static information about the vessel used (width (in m), length (in
     * m), maximum draft (in m)).
     *
     * ### Continuous coordinates
     *
     * Depending on the boolean parameter `continuousCoordinates`, the longitudes of the points
     * of the route returned can be between -180° and 180° (`false`) or continuous (ie greater
     * than 180° or lower than -180° after crossing the antimeridian).
     * The default behavior is to return continuous coordinates (the parameter is set to `true`
     * as default). However, we encourage the use of normalized longitudes between -180° and
     * 180° setting the parameter to `true` when requesting a route.
     *
     * ### Routing parameters
     *
     * Departure time (Unix time in ms) and speed can be specified in order to get an accurate
     * ETA. The speed can be given in knots using the parameter `speedInKts` or in km/h using
     * the parameter `speed`. The ETA (Unix time in ms) and duration (in ms) take into account
     * the maximum authorized speed in specific areas such as canals. If the vessel speed is
     * superior to the authorized speed of a crossed area, we assume the vessel will sail at
     * maximum authorized speed in the area and at the given vessel speed outside the area.
     *
     * #### ECA / SECA zones
     *
     * ECA zones can be avoided by using the parameter `avoidSeca`. In that case, the distance
     * travelled in the ECA zone is minimized.
     * The HRA (high risk area) zone can be avoided using parameter `avoidHRA`. If no points
     * from the query are in the HRA zones, the zone will be totally avoided, if at least one
     * point is in the HRA zone, the route will go through it but minimize the distance
     * navigated in it.  The distance in HRA is available in the response in the field
     * `hraIntersection`.
     *
     * You can specify the view of the data that you'd like to use by using the header
     * `accept-header`. For instance, in order to route with a view of ECAs / SECAs as of
     * 2025-05-01, one would pass the header `accept-version: seca=2025-05-1`. More info on
     * versioning can be found [in the versioning
     * section](https://developer.searoutes.com/reference/versioning).
     *
     * #### Ice areas and block areas
     *
     * By default, the seas that are difficult to sail due to the presence of ice are not
     * allowed (for example the Bering Sea, the Northern Sea Route, etc). You can allow the
     * route to go through these zones by using the `allowIceAreas` parameter.
     * It is possible to block some areas by using the parameter `blockAreas` which takes a
     * list of ids (Panama Canal : 11112 , Suez Canal : 11117). In that case, the route won't
     * cross the areas blocked.
     *
     * Note that all rivers are available on this endpoint using appropriate vessel draft (in
     * m).
     *
     * @summary Get sea route between locations.
     * @throws FetchError<400, types.GetSeaRouteResponse400> Bad request
     * @throws FetchError<404, types.GetSeaRouteResponse404> Not found
     */
    SDK.prototype.getSeaRoute = function (metadata) {
        return this.core.fetch('/route/v2/sea/{locations}', 'get', metadata);
    };
    /**
     * This endpoints returns the route between a source location and a target location on sea,
     * along with the route distance (in meters), duration (in milliseconds) and details about
     * the zones it goes through. We return the shortest route sailed considering traffic
     * separation schemes and port entries.
     *
     * ### Locations: origin, destination and waypoints
     *
     * Locations can be specified as coordinate pairs or UN/LOCODEs. Coordinate pairs are
     * formatted as `longitude,latitude`. Each position should be separated by semicolons `;`.
     * You can add up to 20 positions, including waypoints on a route (up to 18), or request
     * several legs of a trip in one go by listing more than two positions. For instance:
     * `-1.26617431640625,50.79551936692376;8.8330078125,53.88491634606499;-3.2409667968749996,53.50111704294316`.
     *
     * ### Vessel specific routes
     *
     * You can get vessel specific routes by specifying the IMO number of a vessel. The
     * returned route will be compatible with the vessel dimensions (width (in m), length (in
     * m), maximum draft (in m)). If the IMO is not given, We choose a small vessel in order
     * not to block any route.
     * You can also specify the current draft (in m) of the vessel using the parameter
     * `vesselDraft`, with or without giving an IMO. If both IMO and vessel draft are given,
     * the given draft (in m) is used and the other dimensions (width, length) are retrieved
     * from the IMO number.
     * The response contains static information about the vessel used (width (in m), length (in
     * m), maximum draft (in m)).
     *
     * ### Continuous coordinates
     *
     * Depending on the boolean parameter `continuousCoordinates`, the longitudes of the points
     * of the route returned can be between -180° and 180° (`false`) or continuous (ie greater
     * than 180° or lower than -180° after crossing the antimeridian).
     * The default behavior is to return continuous coordinates (the parameter is set to `true`
     * as default). However, we encourage the use of normalized longitudes between -180° and
     * 180° setting the parameter to `true` when requesting a route.
     *
     * ### Routing parameters
     *
     * Departure time (Unix time in ms) and speed can be specified in order to get an accurate
     * ETA. The speed can be given in knots using the parameter `speedInKts` or in km/h using
     * the parameter `speed`. The ETA (Unix time in ms) and duration (in ms) take into account
     * the maximum authorized speed in specific areas such as canals. If the vessel speed is
     * superior to the authorized speed of a crossed area, we assume the vessel will sail at
     * maximum authorized speed in the area and at the given vessel speed outside the area.
     *
     * #### Avoid zones
     *
     * ECA zones can be avoided by using the parameter `avoidSeca`. In that case, the distance
     * travelled in the ECA zone is minimized.
     * The HRA (high risk area) zone can be avoided using parameter `avoidHRA`. If no points
     * from the query are in the HRA zones, the zone will be totally avoided, if at least one
     * point is in the HRA zone, the route will go through it but minimize the distance
     * navigated in it.  The distance in HRA is available in the response in the field
     * `hraIntersection`.
     *
     * #### Ice areas and block areas
     *
     * By default, the seas that are difficult to sail due to the presence of ice are not
     * allowed (for example the Bering Sea, the Northern Sea Route, etc). You can allow the
     * route to go through these zones by using the `allowIceAreas` parameter.
     * It is possible to block some areas by using the parameter `blockAreas` which takes a
     * list of ids (Panama Canal : 11112 , Suez Canal : 11117). In that case, the route won't
     * cross the areas blocked.
     *
     * Note that all rivers are available on this endpoint using appropriate vessel draft (in
     * m).
     *
     * ### Waypoints returned
     *
     * This endpoint additionally returns a list of waypoints of interest in the `waypoints`
     * fields of the `properties` of each leg. The waypoints can be of different types :
     * - `VOYAGE` for voyage scale events such as departure and arrival with class either
     * `ENTRY` or `EXIT`;
     * - `ROUTING` for special zones with class either `ENTRY` or `EXIT`;
     * - `SECA` for ECA zones with class either `ENTRY` or `EXIT`;
     * - `SPEED` for points where speed must be adjusted with class `INCREASE`, `DECREASE` or
     * `TARGET` (only used to know the speed at departure when it must be different than the
     * given speed).
     *
     * @summary Get detailed sea route plan between locations.
     * @throws FetchError<400, types.GetPlanSeaRouteResponse400> Bad request
     * @throws FetchError<404, types.GetPlanSeaRouteResponse404> Not found
     */
    SDK.prototype.getPlanSeaRoute = function (metadata) {
        return this.core.fetch('/route/v2/sea/{locations}/plan', 'get', metadata);
    };
    /**
     * This endpoint retrieves itineraries for a given carrier on a given port pair.
     * It provides estimated transit times, distance and route details, along with CO₂e data.
     *
     * ## Response
     *
     * The response is a **GeoJSON FeatureCollection**, where:
     * - Each **`Feature`** represents an itinerary.
     * - **`Properties`** contain key details such as transit time, CO₂ emissions, and ports of
     * call.
     * - **`Geometry`** provides the route geometry as a `LineString` in GeoJSON format.
     *
     * | Field              | Description |
     * |-------------------|-------------|
     * | `duration.days`  | Estimated transit time in days, including transhipments and waiting
     * time in ports. |
     * | `duration.ms`    | Estimated transit time in milliseconds. |
     * | `departure.dayNumber` | Represents the starting reference day of the journey. |
     * | `arrival.dayNumber` | Represents the arrival day relative to the departure day. |
     * | `from.locode`    | Departure port UN/LOCODE. |
     * | `from.name`      | Departure port name. |
     * | `to.locode`      | Arrival port UN/LOCODE. |
     * | `to.name`        | Arrival port name. |
     * | `distance`       | Total itinerary distance (in meters). |
     * | `mode`           | Transport mode (`"SEA"`). |
     * | `serviceId`      | Service ID associated with the leg. Retrievable with
     * `/search/v2/service/{id}`  |
     * | `calls`          | List of intermediate port calls. |
     * | `co2e`           | Estimated CO₂ emissions for the itinerary. |
     * | `geometry`       | GeoJSON `LineString` representing the leg’s route geometry. |
     *
     * ### Notes & Considerations
     * - GeoJSON compliance: by default, the response includes a properties field at the
     * FeatureCollection level. If full GeoJSON compliance is required, you should omit
     * `properties` field.
     * - **Sorting behavior**:
     *   - `TRANSIT_TIME`: Returns fastest itineraries first.
     *   - `CO2`: Returns itineraries with the lowest estimated CO₂ emissions first.
     * - Each itinerary has a **unique `hash`**, which can be used to retrieve additional CO₂
     * details from `/co2/v2/proformas/{hash}`.
     * - **Proforma API itineraries vs. Execution API itineraries**:
     *   - `/itinerary/v2/proformas` provides planned itineraries for strategic procurement and
     * short to long-term support to decision-making.
     *   - `/itinerary/v2/execution` data (from `/itinerary/v2/execution`) reflects upcoming
     * departures, including sailing dates and assigned vessels, for optimizing immediate
     * shipments' operations.
     * - Hashes are not intended to be persisted or used as permanent references.
     *
     * ## Support endpoints and resources
     * - ** Retrieve CO₂e details for an itinerary** using the
     * [`/co2/v2/proformas/{hash}`](/reference/getco2) endpoint
     * - **Learn about our methodology**: visit the [Methodology for sea emissions
     * calculation](/docs/co2-emissions-methodology) page.
     *
     * @summary Get proformas and their CO₂e emissions for a carrier on a port pair.
     * @throws FetchError<400, types.GetItinerariesFromProformasResponse400> Bad request
     * @throws FetchError<404, types.GetItinerariesFromProformasResponse404> Not found
     */
    SDK.prototype.getItinerariesFromProformas = function (metadata) {
        return this.core.fetch('/itinerary/v2/proformas', 'get', metadata);
    };
    /**
     * This endpoint retrieves detailed itinerary information for a specific route, identified
     * by its unique hash.
     * Itinerary hashes are generated and returned in the `/co2/v2/plan` response, allowing
     * users to request detailed routing information for a given carrier and port pair.
     *
     * The response provides:
     * - Itinerary-level details (duration, distance, CO₂e emissions).
     * - Leg-specific details (departure and arrival days, port of calls, service ID).
     * - Route geometry (LineString in GeoJSON format).
     *
     * ## Response
     * The response is a GeoJSON FeatureCollection, where:
     * - Each `Feature` represents a leg of the itinerary.
     * - `Properties` contain key details such as transit time, CO₂ emissions, and ports of
     * call.
     * - `Geometry` provides the route geometry as a `LineString` in GeoJSON format.
     *
     * | Field                   | Description |
     * |-------------------------|-------------|
     * | `duration.days`         | Estimated transit time in days, including transhipments and
     * waiting time in ports. |
     * | `duration.ms`           | Estimated transit time in milliseconds. |
     * | `departure.dayNumber`   | Represents the starting reference day of the journey. |
     * | `arrival.dayNumber`     | Represents the arrival day relative to the departure day. |
     * | `from.locode`          | Departure port UN/LOCODE. |
     * | `from.name`            | Departure port name. |
     * | `to.locode`            | Arrival port UN/LOCODE. |
     * | `to.name`              | Arrival port name. |
     * | `distance`             | Total itinerary distance (in meters). |
     * | `mode`                 | Mode of transport (`"SEA"`). |
     * | `serviceId`            | Service ID associated with the leg. Retrievable with
     * `/search/v2/service/{id}`. |
     * | `calls`                | List of intermediate port calls. |
     * | `co2e`                 | Estimated CO₂ emissions for the itinerary (in grams),
     * corresponding to the load characteristics passed as input when searching for the
     * itinerary |
     * | `geometry`             | GeoJSON `LineString` representing the leg’s route geometry. |
     *
     * ### Notes & Considerations
     * - GeoJSON compliance: by default, the response includes a properties field at the
     * FeatureCollection level. If full GeoJSON compliance is required, you should omit
     * `properties` field.
     * - Antimeridian crossing: if a LineString crosses the antimeridian (longitude ±180°), the
     * response may include longitude values greater than 180° or less than -180°. This
     * behavior maintains continuity in a single LineString.
     * - Hashes are not intended to be persisted or used as permanent references.
     *
     * ## Support endpoints and resources
     * - **Get CO₂-based itineraries**: use our [`/co2/v2/plan`](/reference/getco2plan)
     * endpoint to retrieve itinerary hashes and estimated emissions for a given carrier and
     * port pair.
     * - **Learn about our methodology**: visit the [Methodology for sea emissions
     * calculation](/docs/co2-emissions-methodology) page.
     *
     * @summary Get itinerary by hash.
     * @throws FetchError<400, types.GetItineraryByHashResponse400> Bad request
     */
    SDK.prototype.getItineraryByHash = function (metadata) {
        return this.core.fetch('/itinerary/v2/proformas/{hash}', 'get', metadata);
    };
    /**
     * Gain the ability to choose the greenest or fastest option among upcoming vessel
     * departures, selecting from the best available itineraries per carrier.
     * This endpoint returns the possible itinerary and their CO₂e emissions in the near
     * future, for a given carrier and a given port pair.
     * The CO₂e emissions are returned in grams.
     *
     * ## Input
     * Location of origin (`fromLocode`) and destination (`toLocode`), and carrier information
     * (`carrierScac` or `carrierId`) are mandatory fields.
     *
     * ### Dates
     *
     * This endpoint takes two dates as input: `fromDate` and `toDate`. It represents the
     * departure date range within which the endpoint will search for itineraries.
     * Passing the dates is optional. If no date is given, the endpoint will return itineraries
     * sailing 7 days onwards after the current date.
     * Both dates should be passed using the ISO 8601 format.
     *
     * ### Sorting
     * To get the results in order of preference, use the parameter `sortBy`. You can input
     * `CO2` or `TRANSIT_TIME`, depending on your main interest.
     *
     * ### Impact of the weight and number of containers on CO₂e emissions and intensity
     * calculation
     *
     * #### For CO₂e emissions:
     * The CO₂e emissions only depend on the number of containers (`nContainers`). If you don't
     * know the `nContainers` but you know the total weight of the goods, our algorithm will
     * estimate the `nContainers` based on the `weight`.
     * If neither `nContainers` nor `weight` are provided, by default, we return emissions for
     * one TEU (20G1, Dry).
     *
     * #### For CO₂e intensity:
     * The CO₂e intensity depends on the `weight`. If you don't know the `weight` but you know
     * the `nContainers`, our algorithm will estimate the `weight` based on the `nContainers`.
     *
     * ## Response
     *
     * The response is a list of `featureCollection`'s, where each feature collection is a
     * possible itinerary.
     *
     * The feature collection is made of:
     * - One or multiple features
     * A direct itinerary results in a feature collection made of only one feature.
     * An itinerary with transshipments results is a feature collection made of multiple
     * features, each of it representing one leg.
     * - One hash
     * Each itinerary is associated to a unique fingerprint (called "hash") that you can use to
     * retrieve the CO₂e breakdown and details of the itinerary via the /co2/v2/execution
     * endpoint.
     * It will return the CO₂e breakdown (total, TTW, WTT, intensity values).
     *
     * Each feature has its own properties, including details such as duration, departure and
     * arrival dates, locations, distance, mode, service ID, asset (vessel) details, port of
     * calls, total CO₂e emissions.
     *
     * Results are given in the order of sorting requested (`CO2` or `TRANSIT_TIME`). If no
     * `sortBy` is input, the sorting will be done on the CO₂e basis.
     *
     * @summary Get ocean schedules and their CO₂e emissions for a port pair
     * @throws FetchError<400, types.GetItineraryPerDepartureResponse400> Bad request
     * @throws FetchError<404, types.GetItineraryPerDepartureResponse404> Not found
     */
    SDK.prototype.getItineraryPerDeparture = function (metadata) {
        return this.core.fetch('/itinerary/v2/execution', 'get', metadata);
    };
    return SDK;
}());
var createSDK = (function () { return new SDK(); })();
module.exports = createSDK;
