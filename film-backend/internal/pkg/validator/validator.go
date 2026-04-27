package validator

import (
	"fmt"
	"reflect"
	"strings"

	"github.com/kataras/iris/v12"
)

type ValidationError struct {
	Field   string `json:"field"`
	Message string `json:"message"`
}

type ValidationResult struct {
	Errors []ValidationError `json:"errors"`
}

func (v *ValidationResult) Error() string {
	if len(v.Errors) == 0 {
		return ""
	}
	return v.Errors[0].Message
}

func (v *ValidationResult) HasError() bool {
	return len(v.Errors) > 0
}

func (v *ValidationResult) ErrorMessages() []string {
	msgs := make([]string, len(v.Errors))
	for i, e := range v.Errors {
		msgs[i] = e.Message
	}
	return msgs
}

type Validator struct {
	tagName string
}

func New() *Validator {
	return &Validator{tagName: "validate"}
}

func (v *Validator) Validate(data interface{}) *ValidationResult {
	result := &ValidationResult{Errors: []ValidationError{}}
	v.validateValue(reflect.ValueOf(data), "", result)
	return result
}

func (v *Validator) validateValue(val reflect.Value, prefix string, result *ValidationResult) {
	if val.Kind() == reflect.Ptr {
		val = val.Elem()
	}

	if val.Kind() != reflect.Struct {
		return
	}

	t := val.Type()
	for i := 0; i < t.NumField(); i++ {
		field := t.Field(i)
		fieldValue := val.Field(i)

		fieldName := field.Name
		if prefix != "" {
			fieldName = prefix + "." + fieldName
		}

		validateTag := field.Tag.Get(v.tagName)
		if validateTag == "" || validateTag == "-" {
			if fieldValue.Kind() == reflect.Struct {
				v.validateValue(fieldValue, fieldName, result)
			}
			continue
		}

		rules := strings.Split(validateTag, ",")
		for _, rule := range rules {
			rule = strings.TrimSpace(rule)
			if err := v.applyRule(fieldName, fieldValue, rule); err != nil {
				result.Errors = append(result.Errors, ValidationError{
					Field:   fieldName,
					Message: err.Error(),
				})
			}
		}

		if fieldValue.Kind() == reflect.Struct {
			v.validateValue(fieldValue, fieldName, result)
		}
	}
}

func (v *Validator) applyRule(fieldName string, fieldValue reflect.Value, rule string) error {
	if rule == "required" {
		return v.checkRequired(fieldName, fieldValue)
	}

	if strings.HasPrefix(rule, "min=") {
		return v.checkMin(fieldName, fieldValue, rule[4:])
	}

	if strings.HasPrefix(rule, "max=") {
		return v.checkMax(fieldName, fieldValue, rule[4:])
	}

	if strings.HasPrefix(rule, "minLen=") {
		return v.checkMinLen(fieldName, fieldValue, rule[7:])
	}

	if strings.HasPrefix(rule, "maxLen=") {
		return v.checkMaxLen(fieldName, fieldValue, rule[7:])
	}

	return nil
}

func (v *Validator) checkRequired(fieldName string, fieldValue reflect.Value) error {
	empty := false
	switch fieldValue.Kind() {
	case reflect.String:
		empty = fieldValue.String() == ""
	case reflect.Int, reflect.Int8, reflect.Int16, reflect.Int32, reflect.Int64:
		empty = fieldValue.Int() == 0
	case reflect.Uint, reflect.Uint8, reflect.Uint16, reflect.Uint32, reflect.Uint64:
		empty = fieldValue.Uint() == 0
	case reflect.Float32, reflect.Float64:
		empty = fieldValue.Float() == 0
	case reflect.Bool:
		empty = !fieldValue.Bool()
	case reflect.Slice, reflect.Map, reflect.Array:
		empty = fieldValue.Len() == 0
	case reflect.Ptr, reflect.Interface:
		empty = fieldValue.IsNil()
	case reflect.Invalid:
		empty = true
	}

	if empty {
		return fmt.Errorf("%s is required", fieldName)
	}
	return nil
}

func (v *Validator) checkMin(fieldName string, fieldValue reflect.Value, minStr string) error {
	var min float64
	fmt.Sscanf(minStr, "%f", &min)

	switch fieldValue.Kind() {
	case reflect.Int, reflect.Int8, reflect.Int16, reflect.Int32, reflect.Int64:
		if fieldValue.Int() < int64(min) {
			return fmt.Errorf("%s must be at least %d", fieldName, int(min))
		}
	case reflect.Uint, reflect.Uint8, reflect.Uint16, reflect.Uint32, reflect.Uint64:
		if fieldValue.Uint() < uint64(min) {
			return fmt.Errorf("%s must be at least %d", fieldName, int(min))
		}
	case reflect.Float32, reflect.Float64:
		if fieldValue.Float() < min {
			return fmt.Errorf("%s must be at least %f", fieldName, min)
		}
	}
	return nil
}

func (v *Validator) checkMax(fieldName string, fieldValue reflect.Value, maxStr string) error {
	var max float64
	fmt.Sscanf(maxStr, "%f", &max)

	switch fieldValue.Kind() {
	case reflect.Int, reflect.Int8, reflect.Int16, reflect.Int32, reflect.Int64:
		if fieldValue.Int() > int64(max) {
			return fmt.Errorf("%s must be at most %d", fieldName, int(max))
		}
	case reflect.Uint, reflect.Uint8, reflect.Uint16, reflect.Uint32, reflect.Uint64:
		if fieldValue.Uint() > uint64(max) {
			return fmt.Errorf("%s must be at most %d", fieldName, int(max))
		}
	case reflect.Float32, reflect.Float64:
		if fieldValue.Float() > max {
			return fmt.Errorf("%s must be at most %f", fieldName, max)
		}
	}
	return nil
}

func (v *Validator) checkMinLen(fieldName string, fieldValue reflect.Value, minLenStr string) error {
	var minLen int
	fmt.Sscanf(minLenStr, "%d", &minLen)

	switch fieldValue.Kind() {
	case reflect.String:
		if fieldValue.String() != "" && len(fieldValue.String()) < minLen {
			return fmt.Errorf("%s must be at least %d characters", fieldName, minLen)
		}
	case reflect.Slice, reflect.Map, reflect.Array:
		if fieldValue.Len() > 0 && fieldValue.Len() < minLen {
			return fmt.Errorf("%s must contain at least %d items", fieldName, minLen)
		}
	}
	return nil
}

func (v *Validator) checkMaxLen(fieldName string, fieldValue reflect.Value, maxLenStr string) error {
	var maxLen int
	fmt.Sscanf(maxLenStr, "%d", &maxLen)

	switch fieldValue.Kind() {
	case reflect.String:
		if len(fieldValue.String()) > maxLen {
			return fmt.Errorf("%s must be at most %d characters", fieldName, maxLen)
		}
	case reflect.Slice, reflect.Map, reflect.Array:
		if fieldValue.Len() > maxLen {
			return fmt.Errorf("%s must contain at most %d items", fieldName, maxLen)
		}
	}
	return nil
}

func Validate(data interface{}) *ValidationResult {
	return New().Validate(data)
}

var ShowErrorDetail = false

func SetShowErrorDetail(show bool) {
	ShowErrorDetail = show
}

func buildErrorResponse(code int, message string, err error) iris.Map {
	resp := iris.Map{"code": code, "message": message}
	if ShowErrorDetail && err != nil {
		resp["error"] = err.Error()
	}
	return resp
}

func InternalServerError(ctx iris.Context, err error) bool {
	if err == nil {
		return false
	}
	ctx.StatusCode(500)
	ctx.JSON(buildErrorResponse(500, "internal server error", err))
	return true
}

func InternalServerErrorMsg(ctx iris.Context, msg string) bool {
	ctx.StatusCode(500)
	ctx.JSON(buildErrorResponse(500, msg, nil))
	return true
}

func Unauthorized(ctx iris.Context, msg string) bool {
	ctx.StatusCode(401)
	ctx.JSON(buildErrorResponse(401, msg, nil))
	return true
}

func Forbidden(ctx iris.Context, msg string) bool {
	ctx.StatusCode(403)
	ctx.JSON(buildErrorResponse(403, msg, nil))
	return true
}

func NotFound(ctx iris.Context, msg string) bool {
	ctx.StatusCode(404)
	ctx.JSON(buildErrorResponse(404, msg, nil))
	return true
}

func NotFoundError(ctx iris.Context, msg string) bool {
	ctx.StatusCode(404)
	ctx.JSON(iris.Map{"code": 404, "message": msg})
	return true
}

func BadRequest(ctx iris.Context, err error) bool {
	if err == nil {
		return false
	}
	ctx.StatusCode(400)
	ctx.JSON(buildErrorResponse(400, err.Error(), nil))
	return true
}

func BadRequestWithField(ctx iris.Context, field string, message string) bool {
	ctx.StatusCode(400)
	ctx.JSON(iris.Map{
		"code":  400,
		"field": field,
		"error": message,
	})
	return true
}

func HandleValidation(ctx iris.Context, result *ValidationResult) bool {
	if !result.HasError() {
		return false
	}
	ctx.StatusCode(400)
	ctx.JSON(iris.Map{
		"code":   400,
		"errors": result.Errors,
	})
	return true
}

func Success(ctx iris.Context, data interface{}) {
	ctx.JSON(iris.Map{"code": 0, "data": data})
}

func SuccessWithMessage(ctx iris.Context, msg string) {
	ctx.JSON(iris.Map{"code": 0, "message": msg})
}

func ParseAndValidate[T any](ctx iris.Context) (T, bool) {
	var req T
	if err := ctx.ReadJSON(&req); err != nil {
		ctx.StatusCode(400)
		ctx.JSON(iris.Map{"code": 400, "message": "invalid request"})
		return req, false // return false on error
	}

	result := New().Validate(&req)
	if result.HasError() {
		ctx.StatusCode(400)
		ctx.JSON(iris.Map{
			"code":   400,
			"errors": result.Errors,
		})
		return req, false // return false on error
	}

	return req, true // return true on success
}
