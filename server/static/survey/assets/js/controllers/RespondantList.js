//'use strict';

angular.module('askApp')
    .controller('RespondantListCtrl', function($scope, $rootScope, $http, $routeParams, $location, reportsCommon, surveyShared) {

    function build_map(url) {
        $http.get(url).success(function(data) {
            $scope.locations = _.map(data.answer_domain, function(x) {
                return {
                    visibility: true,
                    lat: parseFloat(x.location__lat),
                    lng: parseFloat(x.location__lng),
                    icon: 'crosshair_white.png'
                }
            });
        });
    }
    function filters_changed(surveySlug) {
        reportsCommon.getRespondents(null, $scope);
        var url = null;
        if ($routeParams.surveySlug == 'fish-market-survey') {
            url = "/report/distribution/" + $routeParams.surveySlug + "/catch-location";
        } else if ($routeParams.surveySlug == 'general-applicationmulti-use-survey') {
            url = "/report/distribution/" + $routeParams.surveySlug + "/survey-location";
        }

        if (url)
            build_map(url);
    }

    function setup_columns() {
        $scope.columns = [ { name: 'Surveyor', field: 'user' }
                         , { name: 'Date', field: 'ts' }
                         , { name: 'Time', field: 'ts' }
                         , { name: 'Status', field: 'review_status' }
                         ];
        var order_by = $location.search().order_by;

        if (order_by) {
            $scope.sortDescending = order_by[0] == "-";
            $scope.currentColumn = $scope.sortDescending ?
                _.find($scope.columns, function (x) { return "-" + x.field == order_by; }) || $scope.columns[1] :
                _.find($scope.columns, function (x) { return x.field == order_by; }) || $scope.columns[1];
        } else {
            $scope.sortDescending = true;
            $scope.currentColumn = $scope.columns[1];
        }

        $scope.changeSorting = function (column) {
            if ($scope.currentColumn == column) {
                $scope.sortDescending = !$scope.sortDescending;
            } else {
                $scope.currentColumn = column;
                $scope.sortDescending = true;
            }
            reportsCommon.getRespondents(null, $scope);
        };
    }

    $scope.goToResponse = function(respondent) {
        window.location = "#/RespondantDetail/" + $scope.survey.slug +
            "/" + respondent.uuid + "?" + $scope.filtered_list_url;
    }
    $scope.market = $location.search().survey_site || "";
    $scope.filter = null;
    $scope.viewPath = app.viewPath;
    $scope.surveyorTimeFilter = 'week';
    $scope.activePage = 'overview';
    $scope.statuses = [];
    $scope.status_single = $location.search().status || "";
    if ($routeParams.surveySlug == 'fish-market-survey') {
        /* Fijian islands */
        $scope.map = {
            center: {
                lat: -17.4624892,
                lng: 179.2583049
            },
            zoom: 8,
            msg: null
        };
    } else if ($routeParams.surveySlug == 'general-applicationmulti-use-survey') {
        /* Newport up to Astoria */
        $scope.map = {
            center: {
                lat: 45.382076,
                lng: -123.8025571
            },
            zoom: 9,
            msg: null
        };
    }
    setup_columns();

    $scope.$watch('filter', function (newValue) {
        if (newValue) {
            filters_changed($routeParams.surveySlug);
        }
    }, true);

    $scope.$watch('status_single', function (newValue) {
        if ($scope.filter) {
            filters_changed($routeParams.surveySlug);
        }
    }, false);

    $scope.$watch('market', function (newValue) {
        if ($scope.filter) {
            filters_changed($routeParams.surveySlug);
        }
    }, true);

    $scope.$watch('surveyorTimeFilter', function (newValue) {
        if ($scope.filter) {
            filters_changed($routeParams.surveySlug);
        }
    }, true);

    surveyShared.getSurvey(function(data) {
        data.questions.reverse();
        $scope.survey = data;
        reportsCommon.setup_market_dropdown($scope);
        var start_date = $location.search().ts__gte ?
            new Date(parseInt($location.search().ts__gte, 10)) :
            reportsCommon.dateFromISO($scope.survey.response_date_start);
        var end_date = $location.search().ts__lte ?
            new Date(parseInt($location.search().ts__lte, 10)) :
            reportsCommon.dateFromISO($scope.survey.response_date_end);
        $scope.filter = {
            min: reportsCommon.dateFromISO($scope.survey.response_date_start).valueOf(),
            max: reportsCommon.dateFromISO($scope.survey.response_date_end).valueOf(),
            startDate: start_date.valueOf(),
            endDate: end_date.valueOf()
        }

        _.each($scope.survey.questions, function (question) {
            // save a reference to filter questions which are specified by uri
            question.filters = {};
            if (question.visualize && question.filter_questions) {
                question.filterQuestions = [];
                _.each(question.filter_questions, function (filterQuestion) {
                    question.filterQuestions.push($scope.getQuestionByUri(filterQuestion));
                });

            }
        });
    });


    $scope.getQuestionByUri = function (uri) {
        return _.findWhere($scope.survey.questions, {'resource_uri': uri});
    };

    $scope.getQuestionBySlug = function (slug) {
        return _.findWhere($scope.survey.questions, {'slug': slug});
    };
    $scope.getRespondents = function(url) {
        // Higher order function to make the next/prve buttons work.
        return reportsCommon.getRespondents(url, $scope);
    }
});
