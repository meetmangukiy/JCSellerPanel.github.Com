var existingFilters = {};
var settings;

var filterType;
var filterfield;
var filterMode;

var currentfocus;

var dateFormat = 'MM/D/YYYY';
var datetimeFormat = 'MM/D/YYYY hh:mm A';

var dateRange = { startDate: '', endDate: '' };

function getExistingFilters() {
    var currUrl = $(location).attr('href');

    if (currUrl.split("?filter=").length > 1) {
        currUrl = currUrl.split("?filter=")['1'];

        if (currUrl.split("#").length > 1)
            currUrl = currUrl.split("#")['0'];

        if (currUrl.split("?").length > 1)
            currUrl = currUrl.split("?")['0'];

        var existingFilterString = currUrl;

        existingFilterString = decodeURIComponent(existingFilterString);

        existingFilters = $.parseJSON(existingFilterString);
    }

    return existingFilters;
}

function loadFilterData(filterString, href) {
    var currWindowHref = window.location.href;

    if (href != null && href != currWindowHref) {
        currWindowHref = href;
    }

    if (filterString == '' || $.isEmptyObject(filterString)) {
        window.location.href = currWindowHref.split('?filter=')[0];
        return;
    }

    var filter = JSON.stringify(filterString);

    var encodedFilter = encodeURIComponent(filter);

    var reqUrl;

    if (currWindowHref.indexOf("?filter=") != -1) {
        var extract = currWindowHref.match(/filter=(.*)/).pop();
        reqUrl = currWindowHref.replace(extract, encodedFilter);
    } else {
        reqUrl = currWindowHref + "?filter=" + encodedFilter;
    }

    if (filter !== "") {
        reqUrl = reqUrl.replace(/[\/]*page:[\d]+/, "");

        window.location.href = reqUrl;
    }
}

function updateExistingFilters(filterField, value, dataHref) {
    if (existingFilters[filterField]) {
        if (value == '*') {
            existingFilters[filterField] = [];
        } else if (existingFilters[filterField][value] != null) {
            delete existingFilters[filterField][value];
        } else {
            for (var i in existingFilters[filterField]) {
                if (existingFilters[filterField][i] == value) {
                    delete existingFilters[filterField][i];
                }
            }
        }

        if ((existingFilters[filterField].length) < 1 || $.isEmptyObject(existingFilters[filterField])) {
            delete existingFilters[filterField];
        }
    }

    loadFilterData(existingFilters, dataHref);

}

function removeExistingFilter(filterField) {
    var value;

    var $filterOptions = $(".popover #popover" + filterField + ".filterOptions");

    //	filterField = filterField || $filterOptions.attr("filter-field");

    //	var $title = $(".popover .popover-title");

    $popover = $filterOptions.parents('.popover');

    $popover.find(".resetColumn").each(function() {

        $(this).unbind('click');
        $(this).bind('click', function() {

            updateExistingFilters(filterField, '*', $('#ColumnFilter' + filterField).attr('data-href'));

        });
    });

    $filterOptions.find(".removeFilter").each(function() {

        $(this).unbind('click');
        $(this).bind('click', function() {

            $(this).closest("span").remove();

            value = $(this).attr("id");
            updateExistingFilters(filterField, value, $('#ColumnFilter' + filterField).attr('data-href'));

        });
    });
    /*
    $filterOptions.find('li input[class="option"]').each(function() {

    	$(this).unbind('change');
    	$(this).bind('change', function() {

    		if( ! this.checked )
    		{
    			value = $(this).attr('value');
    			updateExistingFilters(filterField, value);
    		}
    	});
    });
    */
}

function applyfilter(filterField) {
    $submit = $(".popover #popover" + filterField + ".filterOptions .editable-submit");

    if ($submit.length < 1) {
        return;
    }

    $submit.unbind('click');

    $submit.bind('click', function() {

        filterType = settings['fields'][filterField]['type'];
        filterMode = settings['fields'][filterField]['mode'];

        var $filterOptions = $(this).closest('.filterOptions');

        var option = {};

        if (filterType == "preFilled") {
            if ($filterOptions.find('input[class="option"]:checked').length > 0) {
                key = 0;

                $filterOptions.find('input[class="option"]:checked').each(function() {

                    option[key] = this.value;

                    key++;

                });
            }
        } else {
            var term = $filterOptions.find('.searchTerm').val();

            if (term.trim() != null || term.trim() != '') {
                term = term.trim();

                //				if( filterType == "text" )
                //				{
                //					option[0] = term;
                //				}
                //				else if( filterType == "number" )
                {
                    term = term.toString();

                    var conditionType = $filterOptions.find('.searchCondition option:selected').attr('value');

                    if (conditionType) {
                        if (conditionType == 'bt') {
                            option[conditionType] = { 0: term, 1: $filterOptions.find('.filterRange .searchTerm').val().toString() };
                        } else {
                            option[conditionType] = term;
                        }
                    } else {
                        option[0] = term;
                    }
                }
            }
        }

        if (Object.keys(option).length) {
            if (filterMode == 'single') {
                delete(existingFilters[filterField]);
            }

            if (filterType == "preFilled") {
                delete(existingFilters[filterField]);
            }

            if (filterField in existingFilters) {
                $.each(option, function(index, val) {

                    for (var i in existingFilters[filterField]) {
                        if (existingFilters[filterField][i] == val) {
                            index = i;
                        }
                    }

                    if (existingFilters[filterField][index] !== val) {
                        while (existingFilters[filterField][index] != null) {
                            index++;
                        }
                    }
                    existingFilters[filterField][index] = val;

                });
            } else {
                existingFilters[filterField] = option;
            }
        }

        $('#ColumnFilter' + filterField).popover('hide');

        loadFilterData(existingFilters, $('#ColumnFilter' + filterField).attr('data-href'));

    });
}



function initColumnFilter(localSettings) {
    settings = localSettings;

    $('.filterColumn').each(function() {

        filterField = $(this).attr("filter-field");
        filterType = settings['fields'][filterField]['type'];
        filterMode = settings['fields'][filterField]['mode'];

        var deleteBtn = '';
        existingFilters = getExistingFilters();

        if (existingFilters.hasOwnProperty(filterField)) {
            deleteBtn = '<button type="button" title="Remove Filter" class="btn btn-danger btn-sm editable-cancel resetColumn">' +
                '<i class="fa fa-trash-o"></i>' +
                '</button>';
        }

        var applyButton = '<div class="editable-buttons">' +
            '<button type="submit" title="Apply Filter" class="btn btn-primary btn-sm editable-submit">' +
            '<i class="glyphicon glyphicon-ok"></i>' +
            '</button>' + deleteBtn +
            '</div>';

        var data = false;

        if (filterType == "preFilled") {
            var dataOptions = settings['fields'][filterField]['dataOptions'] || {};

            var sortedArray = [];

            for (var i in dataOptions) {
                // Push each JSON Object entry in array by [value, key]
                sortedArray.push([dataOptions[i].toLowerCase(), i]);
            }

            dataOptions = sortedArray.sort();

            var list = '<li style="margin-left:0;margin-bottom:5px;">' +
                '<div class="input-group" style="max-width:280px;">' +
                '<span class="input-group-addon"><i class="glyphicon glyphicon-search"></i></span>' +
                '<input placeholder="Search" class="form-control input-mini search-query">' +
                '<span class="input-group-btn">' +
                '<button type="button" title="clear" class="btn btn-default search-query-clear"><i class="glyphicon glyphicon-remove"></i></button>' +
                '<button type="submit" title="Apply Filter" class="btn btn-primary btn-sm editable-submit"><i class="glyphicon glyphicon-ok"></i></button>' +
                deleteBtn +
                '</span>' +
                '</div>' +
                '</li>' +
                '<li>' +
                '<input type="checkbox" class="filterOptionsSelectAll" value="" id="filterOptionsSelectAll_' + filterField + '">' +
                '<label for="filterOptionsSelectAll_' + filterField + '">Select All</label>' +
                '</li>';

            $.each(dataOptions, function(key, value) {
                list += '<li class="listOption">' +
                    '<input type="checkbox" class="option" name="option" value="' + value[1] + '" id="checkbox' + value[1] + '">' +
                    '<label for="checkbox' + key + '">' + value[0] + '</label>' +
                    '</li>';
            });

            data = '<ul>' + list + '</ul>';
        } else if (filterType == "text" || filterType == "number" || filterType == "date" || filterType == "datetime") {
            var inputType = 'text';
            var placeholder = 'Search';
            var extraAttr = '';

            data = '<div class="form-inline editableform">' +
                '<div class="control-group form-group">' +
                '<div>';

            if (filterType == "date" || filterType == "datetime") {
                data += '<div class="input-group">' +
                    '<input type="text" placeholder="Select DateRange" class="form-control searchTerm datepickerDateRange" style="opacity: 0" disabled>' +
                    '</div>';
            } else {
                if (filterType == "number") {
                    inputType = 'number';
                    //										placeholder = 0;
                    extraAttr = 'onkeypress="return isNumberKey(event)"';

                    data += '<div class="editable-input">' +
                        '<select class="form-control input searchCondition">' +
                        '<option value="0">=</option>' +
                        '<option value="gt">></option>' +
                        '<option value="lt"><</option>' +
                        '<option value="bt">><</option>' +
                        '</select>' +
                        '</div>';
                } else if (filterType == "text") {
                    data += '<div class="editable-input">' +
                        '<select class="form-control input searchCondition">' +
                        '<option value="aw">Anywhere</option>' +
                        '<option value="0">=</option>' +
                        '<option value="sw">Start With</option>' +
                        '<option value="ew">End With</option>' +
                        //'<option value="dc">Does Not Contain</option>'+
                        '</select>' +
                        '</div>';
                }

                data += '<div class="editable-input">' +
                    '<input placeholder="' + placeholder + '" class="form-control input-mini searchTerm" type="' + inputType + '" ' + extraAttr + ' required=true>' +
                    '</div>';

                if (filterType == "number") {
                    data += '<div class="filterRange editable-input hidden">' +
                        '<span> - </span>' +
                        '<input placeholder="' + placeholder + '" class="form-control input-mini searchTerm searchTermTo" type="' + inputType + '" ' + extraAttr + '>' +
                        '</div>';
                }
                data += applyButton;
            }

            data += '</div>' +
                //						'<div style="display: none;" class="editable-error-block help-block"></div>'+
                '</div>' +
                '</div>';

            if (filterType == "date" || filterType == "datetime") {
                data += '<div class="hasDateRangePicker"></div>';
            }

            if (filterMode != 'single') {
                data = '<div class="existingFilters"></div>' + data;
            }
        }

        if (!data) {
            return;
        }

        existingFilters = getExistingFilters();

        var content = '<div class="filter-popover-content" style="display:none;">' +
            '<div class="filterOptions" id="popover' + filterField + '" filter-field="' + filterField + '">' + data + '</div>' +
            '</div>';

        $(content).insertAfter($(this));

        $(this)
            .popover({
                'html': true,
                'placement': "bottom",
                //'container': "body", // removed becose of popover css
                'content': function() {
                    return $(this).next('.filter-popover-content').html();
                }
            })
            .on('hide.bs.popover', function() { $('.customTemplate').removeClass('customTemplate'); })
            .on('show.bs.popover', function() { console.log('open'); })
            .on('shown.bs.popover', function() {

                filterField = $(this).attr("filter-field");
                filterType = settings['fields'][filterField]['type'];
                filterMode = settings['fields'][filterField]['mode'];

                existingFilters = getExistingFilters();

                //				if( existingFilters.hasOwnProperty( filterField ) )
                //				{
                //					var title = '<a class="resetColumn pull-right fa fa-trash-o" field="'+ filterField +'"></a>';
                //					$('.popover-title').append( title );
                //				}

                $filterOptions = $(".popover #popover" + filterField + ".filterOptions");

                if ($filterOptions.find('.searchTerm').data('daterangepicker')) {
                    $filterOptions.find('.searchTerm').data('daterangepicker').remove();
                }

                if (existingFilters.hasOwnProperty(filterField)) {
                    var $contentBlock = $filterOptions;

                    if (filterType == "date" || filterType == "datetime") {
                        // add resetColumn btn to title , as we cant change daterangepicker's buttons
                        if (existingFilters.hasOwnProperty(filterField)) {
                            var rightPosition = 252;

                            if (filterType == "datetime") {
                                rightPosition = 160;
                            }

                            var title = '<button type="button" style="top: 64px; right: ' + rightPosition + 'px; position: absolute; z-index: 100333;" field="' + filterField + '" class="btn btn-danger btn-sm editable-cancel resetColumn pull-right" title="Remove This Filter"><i class="fa fa-trash-o"></i></button>';

                            $('.popover-title').after(title);
                        }

                        dateRange['startDate'] = moment(existingFilters[filterField][Object.keys(existingFilters[filterField])[0]]);
                        dateRange['endDate'] = moment(existingFilters[filterField][Object.keys(existingFilters[filterField])[1]]);

                        if (filterType == "datetime") {
                            $filterOptions.find(".searchTerm").val(dateRange['startDate'].format(datetimeFormat) + ' - ' + dateRange['endDate'].format(datetimeFormat));
                        } else {
                            $filterOptions.find(".searchTerm").val(dateRange['startDate'].format(dateFormat) + ' - ' + dateRange['endDate'].format(dateFormat));
                        }
                    } else {
                        var existingData = '';

                        $.each(existingFilters[filterField], function(index, value) {

                            if (filterType == "preFilled") {
                                $contentBlock.find("li input[value='" + value + "']").attr('checked', true);
                            } else {
                                if (filterMode == "single") {
                                    if ($contentBlock.find(".searchCondition").length > 0) {
                                        $contentBlock.find(".searchCondition").val(index);

                                        if (index == 'bt') {
                                            $contentBlock.find(".filterRange").removeClass("hidden");
                                            $filterOptions.find(".searchTerm").addClass('halfTextbox');

                                            $contentBlock.find(".filterRange .searchTerm").val(value[1]);

                                            value = value[0];
                                        }

                                        $contentBlock.find(".searchTerm:eq(0)").val(value);
                                    } else {
                                        $contentBlock.find(".searchTerm").val(value);
                                    }
                                } else {
                                    if (filterType == "number") {
                                        if (!$.isNumeric(index)) {
                                            if (index == 'lt') {
                                                value = '< ' + value;
                                            }
                                            if (index == 'gt') {
                                                value = '> ' + value;
                                            }
                                            if (index == 'bt') {
                                                value = '><' + value;
                                            }
                                        }
                                    }

                                    existingData += "<span class='existingOption'>" +
                                        value + " <input type='button' value='x' class='removeFilter' id='" + index + "'>" +
                                        "</span>";
                                }
                            }
                        });


                        if ($contentBlock.find(".existingFilters").length > 0) {
                            $contentBlock.find(".existingFilters").html(existingData);
                        }
                    }
                }

                if (filterType == "date" || filterType == "datetime") {
                    var dateoptions = {
                        format: dateFormat,
                        parentEl: '.popover-content',
                        customTemplate: true,
                        applyClass: "btn-primary editable-submit",
                        cancelClass: "btn-default editable-cancel hidden",
                    };

                    if (filterType == "datetime") {
                        dateoptions['format'] = datetimeFormat;
                        dateoptions['timePicker'] = true;
                        dateoptions['timePickerIncrement'] = 15;
                    }

                    $filterOptions.find('.searchTerm').daterangepicker(dateoptions, function(start, end, label) {

                        if (filterType == "datetime") {
                            existingFilters[filterField] = { 0: start.format(datetimeFormat), 1: end.format(datetimeFormat) };
                        } else {
                            existingFilters[filterField] = { 0: start.format(dateFormat), 1: end.format(dateFormat) };
                        }

                        $('#ColumnFilter' + filterField).popover('hide');

                        loadFilterData(existingFilters, '');

                    });
                    if (filterType == "datetime") {
                        $filterOptions.parent('.popover-content').find('.daterangepicker').addClass('hasTimePicker');
                    }

                    $('.customTemplate .editable-cancel').unbind('click');
                    $('.customTemplate .editable-cancel').bind('click', function() {

                        $('#ColumnFilter' + filterField).popover('hide');

                    });
                } else if (filterType == "preFilled") {
                    $('.filterOptions .filterOptionsSelectAll').on('change', function() {
                        if ($(this).is(':checked')) {
                            $(this).closest('.filterOptions').find('li:not(.search-hidden) .option').prop('checked', true);
                        } else {
                            $(this).closest('.filterOptions').find('li:not(.search-hidden) .option').prop('checked', false);
                        }
                    });

                    $('.filterOptions .option').on('change', function() {
                        if (!$(this).is(':checked')) {
                            $(this).closest('.filterOptions').find('.filterOptionsSelectAll').prop('checked', false);
                        }
                    });

                    $filterOptions.find(".search-query-clear").unbind('click');
                    $filterOptions.find(".search-query-clear").bind('click', function(e) {
                        $filterOptions.find(".search-query").val('');
                        // trigger input event manually, as val() will not trigger that even automatically
                        $filterOptions.find(".search-query").trigger("input");
                        // remove selectall checked if total and checked options are not same
                        if (($filterOptions.find('.filterOptionsSelectAll').is(':checked')) && ($filterOptions.find('.option:checked').length !== $filterOptions.find('.option').length)) {
                            $filterOptions.find('.filterOptionsSelectAll').prop('checked', false);
                        }
                    });

                    $filterOptions.find(".search-query").unbind('input');
                    $filterOptions.find(".search-query").bind('input', function(e) {
                        var query = $(this).val();
                        $.each($('.filterOptions li.listOption'), function(index, element) {
                            // By default lets assume that element is not interesting for this search.
                            var showElement = false;
                            if (query != '') {
                                query = query.toLowerCase();
                                var value = $(element).find('label').length > 0 ? $(element).find('label').text() : "";
                                if (value != '') {
                                    value = value.toLowerCase();
                                    if (value.indexOf(query) > -1) {
                                        showElement = true;
                                    }
                                }
                            } else {
                                showElement = true;
                            }
                            // Toggle current element (group or group item) according to showElement boolean.
                            if (!showElement) {
                                $(element).css('display', 'none');
                                $(element).addClass('search-hidden');
                            }
                            if (showElement) {
                                $(element).css('display', 'block');
                                $(element).removeClass('search-hidden');
                            }
                        });
                    });

                    $filterOptions.find(".search-query").focus();
                }

                if ($filterOptions.find(".searchTerm").length > 0) {
                    $filterOptions.find(".searchTerm").focus();

                    $filterOptions.find(".searchTerm").unbind("keypress");

                    // bind 'enter' key
                    $filterOptions.find(".searchTerm").bind('keypress', function(e) {
                        if (e.keyCode == 13 || e.which == 13) {
                            $filterOptions.find(".editable-submit").trigger("click");
                        }
                        if (e.keyCode == 27 || e.which == 27) {
                            $filterOptions.find(".editable-cancel").trigger("click");
                        }
                    });
                }

                if ($filterOptions.find(".searchCondition").length > 0) {
                    var $conditions = $filterOptions.find(".searchCondition");

                    $conditions.unbind('change');
                    $conditions.bind('change', function() {

                        $filterOptions.find('.hasDatepicker').hide();

                        var condition = $(this).find('option:selected').val();

                        $filterRange = $filterOptions.find('.filterRange');

                        if (condition == 'bt') {
                            $filterRange.removeClass("hidden");
                            $filterOptions.find(".searchTerm").addClass('halfTextbox');
                        } else {
                            $filterRange.addClass("hidden");
                            $filterOptions.find(".searchTerm").removeClass('halfTextbox');
                        }

                    });
                }

                removeExistingFilter(filterField);
                applyfilter(filterField);

            });

        $(this).unbind('click');
        $(this).bind('click', function() {

            $(this).popover('toggle');

        });

        //		$(this).siblings('a').unbind('click');
        //		$(this).siblings('a').bind('click', function(e) {
        //
        //			var href = $(this).attr("href");
        //
        //
        //			var currUrl = window.location.href;
        //
        //			if( currUrl.indexOf("?filter=") != -1 )
        //			{
        //				e.preventDefault();
        //				var extract = currUrl.match(/filter=(.*)/).pop();
        //
        //				window.location.href = href+"?filter="+extract;
        //			}
        //
        //		});

    });
}

$('body').on('click', function(e) {
    $('.filterColumn').each(function() {
        //the 'is' for buttons that trigger popups
        //the 'has' for icons within a button that triggers a popup
        if (!$(this).is(e.target) && $(this).has(e.target).length === 0 &&
            $('.popover').has(e.target).length === 0 &&
            $('.daterangepicker').has(e.target).length === 0 &&
            $(e.target).parents('.calendar-date').length == 0 &&
            !$(e.target).hasClass('available') &&
            !$(e.target).hasClass('day')) {
            $(this).popover('hide');

            if ($(this).find('.searchTerm').data('daterangepicker')) {
                $(this).find('.searchTerm').data('daterangepicker').destroy();
            }

        }
    });
});