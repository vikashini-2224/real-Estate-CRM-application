export let Role = /*#__PURE__*/ (function (Role) {
  Role["ADMIN"] = "ADMIN";
  Role["SALES_EMPLOYEE"] = "SALES_EMPLOYEE";
  return Role;
})({});

export let LeadStage = /*#__PURE__*/ (function (LeadStage) {
  LeadStage["NEW"] = "NEW";
  LeadStage["CONTACTED"] = "CONTACTED";
  LeadStage["SITE_VISIT"] = "SITE_VISIT";
  LeadStage["INTERESTED"] = "INTERESTED";
  LeadStage["NEGOTIATION"] = "NEGOTIATION";
  LeadStage["BOOKED"] = "BOOKED";
  LeadStage["LOST"] = "LOST";
  return LeadStage;
})({});

export let UnitType = /*#__PURE__*/ (function (UnitType) {
  UnitType["STUDIO"] = "STUDIO";
  UnitType["ONE_BHK"] = "ONE_BHK";
  UnitType["TWO_BHK"] = "TWO_BHK";
  UnitType["THREE_BHK"] = "THREE_BHK";
  UnitType["FOUR_BHK"] = "FOUR_BHK";
  UnitType["PENTHOUSE"] = "PENTHOUSE";
  UnitType["VILLA"] = "VILLA";
  return UnitType;
})({});

export let UnitStatus = /*#__PURE__*/ (function (UnitStatus) {
  UnitStatus["AVAILABLE"] = "AVAILABLE";
  UnitStatus["RESERVED"] = "RESERVED";
  UnitStatus["BOOKED"] = "BOOKED";
  return UnitStatus;
})({});

export let BookingStatus = /*#__PURE__*/ (function (BookingStatus) {
  BookingStatus["CONFIRMED"] = "CONFIRMED";
  BookingStatus["CANCELLED"] = "CANCELLED";
  return BookingStatus;
})({});
