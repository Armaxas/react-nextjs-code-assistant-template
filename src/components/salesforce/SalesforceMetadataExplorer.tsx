"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  Database,
  Link,
  Shield,
  Eye,
  Download,
  ChevronRight,
  Loader2,
  ArrowDown,
  ExternalLink,
  ArrowLeft,
} from "lucide-react";
import { salesforceService, SalesforceObject } from "@/services/salesforceService";

interface SalesforceField {
  name: string;
  label: string;
  type: string;
  length?: number;
  precision?: number;
  scale?: number;
  required: boolean;
  unique: boolean;
  custom: boolean;
  // Permission-related properties
  createable: boolean;
  updateable: boolean;
  nillable: boolean;
  // Additional metadata properties
  externalId: boolean;
  calculated: boolean;
  autoNumber: boolean;
  sortable: boolean;
  filterable: boolean;
  groupable: boolean;
  // Relationship properties
  relationship?: {
    name: string;
    childObject: string;
    parentObject: string;
  };
  referenceTo?: string[];
  relationshipName?: string;
}

interface SalesforceRelationship {
  fieldName?: string;
  fieldLabel?: string;
  relationshipName?: string;
  referenceTo?: string[];
  relationshipType?: string;
  cascadeDelete?: boolean;
  childSObject?: string;
  field?: string;
  restrictedDelete?: boolean;
  relationship_category?: string;
}

interface ObjectRelationships {
  parent_relationships: SalesforceRelationship[];
  child_relationships: SalesforceRelationship[];
}

export default function SalesforceMetadataExplorer() {
  const [connectionId, setConnectionId] = useState<string>("");
  const [objects, setObjects] = useState<SalesforceObject[]>([]);
  const [filteredObjects, setFilteredObjects] = useState<SalesforceObject[]>(
    []
  );
  const [selectedObject, setSelectedObject] = useState<SalesforceObject | null>(
    null
  );
  const [fields, setFields] = useState<SalesforceField[]>([]);
  const [relationships, setRelationships] = useState<ObjectRelationships | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [objectFilter, setObjectFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCheckingConnection, setIsCheckingConnection] = useState(true);

  // Get connection ID from URL or localStorage and verify connection
  useEffect(() => {
    const verifyConnectionAndLoadObjects = async (connId: string) => {
      try {
        setIsCheckingConnection(true);
        setError(null);
        
        // First verify the connection is still valid
        await salesforceService.getConnectionStatus(connId);
        
        // If connection is valid, load objects
        await loadObjects(connId);
      } catch (err: unknown) {
        console.error("Connection verification failed:", err);
        setError(err instanceof Error ? err.message : "Connection verification failed");
        // Clear invalid connection
        localStorage.removeItem("salesforce_connection_id");
        setConnectionId("");
      } finally {
        setIsCheckingConnection(false);
      }
    };

    const urlParams = new URLSearchParams(window.location.search);
    const connId =
      urlParams.get("connection_id") ||
      localStorage.getItem("salesforce_connection_id");
    if (connId) {
      setConnectionId(connId);
      verifyConnectionAndLoadObjects(connId);
    } else {
      setIsCheckingConnection(false);
    }
  }, []);

  const loadObjects = async (connId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await salesforceService.getObjects(connId);
      setObjects(response.objects);
      setFilteredObjects(response.objects);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load objects");
    } finally {
      setIsLoading(false);
    }
  };

  const loadObjectFields = async (objectName: string) => {
    if (!connectionId) return;

    try {
      setIsLoading(true);
      // Load complete object details including fields and relationships
      const response = await salesforceService.getObjectDetails(
        connectionId,
        objectName,
        true, // include fields
        true  // include relationships
      );
      
      setFields((response.fields || []) as unknown as SalesforceField[]);
      
      // Process relationships from the response
      const relationshipsArray = (response.relationships || []) as unknown as SalesforceRelationship[];
      
      // Separate relationships into parent and child based on relationship_category
      const parentRels = relationshipsArray.filter(rel => rel.relationship_category === 'parent');
      const childRels = relationshipsArray.filter(rel => rel.relationship_category === 'child');
      
      setRelationships({
        parent_relationships: parentRels,
        child_relationships: childRels
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load object details");
    } finally {
      setIsLoading(false);
    }
  };

  const handleObjectSelect = (obj: SalesforceObject) => {
    setSelectedObject(obj);
    setFields([]);
    setRelationships(null);
    loadObjectFields(obj.name);
  };

  // Filter objects based on search and type
  useEffect(() => {
    let filtered = objects;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (obj) =>
          obj.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          obj.label.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply type filter
    if (objectFilter !== "all") {
      if (objectFilter === "custom") {
        filtered = filtered.filter((obj) => obj.custom);
      } else if (objectFilter === "standard") {
        filtered = filtered.filter((obj) => !obj.custom);
      }
    }

    setFilteredObjects(filtered);
  }, [objects, searchTerm, objectFilter]);

  const handleBackNavigation = () => {
    // Navigate back to the main Salesforce Explorer page with the connection ID
    if (connectionId) {
      window.location.href = `/salesforce?connection_id=${connectionId}`;
    } else {
      window.location.href = '/salesforce';
    }
  };

  const exportMetadata = async () => {
    if (!connectionId) return;

    try {
      setIsLoading(true);
      // This would trigger a download
      await salesforceService.exportMetadata(connectionId, "json");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to export metadata");
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingConnection) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <h2 className="text-2xl font-bold">Verifying Connection</h2>
          <p className="text-muted-foreground mt-2">
            Checking Salesforce connection status...
          </p>
        </div>
      </div>
    );
  }

  if (!connectionId) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold">No Salesforce Connection</h2>
          <p className="text-muted-foreground mt-2">
            Please connect to Salesforce first to explore metadata
          </p>
          <Button
            onClick={() => (window.location.href = "/salesforce")}
            className="mt-4"
          >
            Go to Connection
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBackNavigation}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Explorer</span>
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">
              Metadata Explorer
            </h2>
            <p className="text-muted-foreground">
              Explore Salesforce objects, fields, and relationships
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={exportMetadata}
            disabled={isLoading}
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[calc(100vh-12rem)]">
        {/* Objects List */}
        <div className="lg:col-span-1">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Database className="w-5 h-5" />
                <span>Objects</span>
                <Badge variant="secondary">{filteredObjects.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 h-full flex flex-col">
              {/* Search and Filter */}
              <div className="space-y-2 flex-shrink-0">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search objects..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <Select value={objectFilter} onValueChange={setObjectFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Objects</SelectItem>
                    <SelectItem value="standard">Standard Objects</SelectItem>
                    <SelectItem value="custom">Custom Objects</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Objects List */}
              <div className="flex-1 overflow-y-auto space-y-1 min-h-0">
                {isLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                ) : (
                  filteredObjects.map((obj) => (
                    <div
                      key={obj.name}
                      className={`p-3 rounded-md cursor-pointer transition-colors ${
                        selectedObject?.name === obj.name
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-muted"
                      }`}
                      onClick={() => handleObjectSelect(obj)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium truncate">{obj.label}</p>
                          <p className="text-sm opacity-75 truncate">
                            {obj.name}
                          </p>
                        </div>
                        <div className="flex items-center space-x-1">
                          {obj.custom && (
                            <Badge variant="outline" className="text-xs">
                              Custom
                            </Badge>
                          )}
                          <ChevronRight className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Object Details */}
        <div className="lg:col-span-2 h-full">
          {selectedObject ? (
            <div className="h-full flex flex-col">
              <Tabs defaultValue="fields" className="h-full flex flex-col">
                <div className="flex items-center justify-between flex-shrink-0 mb-4">
                  <div>
                    <h3 className="text-2xl font-bold">{selectedObject.label}</h3>
                    <p className="text-muted-foreground">{selectedObject.name}</p>
                  </div>
                  <TabsList>
                    <TabsTrigger value="fields">Fields</TabsTrigger>
                    <TabsTrigger value="relationships">Relationships</TabsTrigger>
                    <TabsTrigger value="permissions">Permissions</TabsTrigger>
                  </TabsList>
                </div>

                {/* Object Properties */}
                <Card className="flex-shrink-0 mb-4">
                  <CardHeader>
                    <CardTitle>Object Properties</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Type</p>
                      <Badge
                        variant={
                          selectedObject.custom ? "secondary" : "default"
                        }
                      >
                        {selectedObject.custom ? "Custom" : "Standard"}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Object Name</p>
                      <code className="text-sm bg-muted px-2 py-1 rounded">
                        {selectedObject.name}
                      </code>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Object Label</p>
                      <code className="text-sm bg-muted px-2 py-1 rounded">
                        {selectedObject.label}
                      </code>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <TabsContent value="fields">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Database className="w-5 h-5" />
                      <span>Fields</span>
                      <Badge variant="secondary">{fields.length}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Field Name</TableHead>
                          <TableHead>Label</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Properties</TableHead>
                          <TableHead>References</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {fields.map((field) => (
                          <TableRow key={field.name}>
                            <TableCell className="font-mono text-sm">
                              {field.name}
                            </TableCell>
                            <TableCell>{field.label}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{field.type}</Badge>
                              {field.length && (
                                <span className="text-xs text-muted-foreground ml-1">
                                  ({field.length})
                                </span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-1">
                                {field.required && (
                                  <Badge
                                    variant="destructive"
                                    className="text-xs"
                                  >
                                    Required
                                  </Badge>
                                )}
                                {field.unique && (
                                  <Badge variant="default" className="text-xs">
                                    Unique
                                  </Badge>
                                )}
                                {field.custom && (
                                  <Badge
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    Custom
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {(field.referenceTo && field.referenceTo.length > 0) ? (
                                <Badge variant="outline" className="text-xs">
                                  <Link className="w-3 h-3 mr-1" />
                                  {field.referenceTo.join(", ")}
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground text-xs">-</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="relationships">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Link className="w-5 h-5" />
                      <span>Relationships</span>
                      {relationships && relationships.parent_relationships && relationships.child_relationships && (
                        <Badge variant="secondary">
                          {(relationships.parent_relationships?.length || 0) + (relationships.child_relationships?.length || 0)}
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {relationships && relationships.parent_relationships && relationships.child_relationships && 
                     ((relationships.parent_relationships?.length || 0) > 0 || (relationships.child_relationships?.length || 0) > 0) ? (
                      <div className="space-y-6">
                        {/* Parent Relationships (Lookup/Master-Detail) */}
                        {relationships.parent_relationships && (relationships.parent_relationships?.length || 0) > 0 && (
                          <div>
                            <h4 className="font-semibold mb-3 flex items-center gap-2">
                              <ExternalLink className="w-4 h-4" />
                              Parent Relationships ({relationships.parent_relationships?.length || 0})
                            </h4>
                            <p className="text-sm text-muted-foreground mb-4">
                              Fields in {selectedObject?.name} that reference other objects
                            </p>
                            <div className="grid gap-3">
                              {relationships.parent_relationships.map((rel, index) => (
                                <div key={index} className="border rounded-lg p-4 bg-muted/20">
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                      <Badge variant="outline" className="text-xs">
                                        {rel.relationshipType === "master_detail" ? "Master-Detail" : "Lookup"}
                                      </Badge>
                                      <code className="text-sm font-mono">{rel.fieldName}</code>
                                    </div>
                                    {rel.cascadeDelete && (
                                      <Badge variant="destructive" className="text-xs">
                                        Cascade Delete
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    <p><strong>Field Label:</strong> {rel.fieldLabel}</p>
                                    <p><strong>References:</strong> {rel.referenceTo?.join(", ")}</p>
                                    {rel.relationshipName && (
                                      <p><strong>Relationship Name:</strong> {rel.relationshipName}</p>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Child Relationships */}
                        {relationships.child_relationships && (relationships.child_relationships?.length || 0) > 0 && (
                          <div>
                            <h4 className="font-semibold mb-3 flex items-center gap-2">
                              <ArrowDown className="w-4 h-4" />
                              Child Relationships ({relationships.child_relationships?.length || 0})
                            </h4>
                            <p className="text-sm text-muted-foreground mb-4">
                              Objects that reference {selectedObject?.name}
                            </p>
                            <div className="grid gap-3">
                              {relationships.child_relationships.map((rel, index) => (
                                <div key={index} className="border rounded-lg p-4 bg-muted/20">
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                      <Badge variant="secondary" className="text-xs">
                                        Child Object
                                      </Badge>
                                      <code className="text-sm font-mono">{rel.childSObject}</code>
                                    </div>
                                    <div className="flex gap-1">
                                      {rel.cascadeDelete && (
                                        <Badge variant="destructive" className="text-xs">
                                          Cascade Delete
                                        </Badge>
                                      )}
                                      {rel.restrictedDelete && (
                                        <Badge variant="outline" className="text-xs">
                                          Restricted Delete
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    <p><strong>Field:</strong> {rel.field}</p>
                                    {rel.relationshipName && (
                                      <p><strong>Relationship Name:</strong> {rel.relationshipName}</p>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Link className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <h3 className="text-lg font-medium">No Relationships Found</h3>
                        <p className="text-sm">
                          This object doesn&apos;t have any lookup or master-detail relationships
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="permissions">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Shield className="w-5 h-5" />
                      <span>Field-Level Security Analysis</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {fields.length > 0 ? (
                      <div className="space-y-6">
                        {/* Permission Summary */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                            <div className="text-2xl font-bold text-green-700">
                              {fields.filter(f => f.createable && f.updateable).length}
                            </div>
                            <div className="text-sm text-green-600">Full Access</div>
                          </div>
                          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                            <div className="text-2xl font-bold text-yellow-700">
                              {fields.filter(f => !f.createable && f.updateable).length}
                            </div>
                            <div className="text-sm text-yellow-600">Read/Update Only</div>
                          </div>
                          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                            <div className="text-2xl font-bold text-blue-700">
                              {fields.filter(f => !f.createable && !f.updateable).length}
                            </div>
                            <div className="text-sm text-blue-600">Read Only</div>
                          </div>
                          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                            <div className="text-2xl font-bold text-red-700">
                              {fields.filter(f => !f.nillable && f.createable).length}
                            </div>
                            <div className="text-sm text-red-600">Required Fields</div>
                          </div>
                        </div>

                        {/* Detailed Field Permissions Table */}
                        <div>
                          <h4 className="text-md font-medium mb-3">Field-Level Permissions</h4>
                          <div className="border rounded-lg overflow-hidden">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Field Name</TableHead>
                                  <TableHead>Label</TableHead>
                                  <TableHead>Type</TableHead>
                                  <TableHead>Create</TableHead>
                                  <TableHead>Update</TableHead>
                                  <TableHead>Required</TableHead>
                                  <TableHead>Permission Level</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {fields.map((field, index) => {
                                  let permissionLevel = "Read Only";
                                  let permissionColor = "text-blue-600 bg-blue-50";
                                  
                                  if (field.createable && field.updateable) {
                                    permissionLevel = "Full Access";
                                    permissionColor = "text-green-600 bg-green-50";
                                  } else if (!field.createable && field.updateable) {
                                    permissionLevel = "Read/Update";
                                    permissionColor = "text-yellow-600 bg-yellow-50";
                                  }

                                  return (
                                    <TableRow key={index}>
                                      <TableCell className="font-medium">
                                        {field.name}
                                        {field.custom && (
                                          <span className="ml-2 px-1.5 py-0.5 text-xs bg-purple-100 text-purple-700 rounded">
                                            Custom
                                          </span>
                                        )}
                                      </TableCell>
                                      <TableCell>{field.label}</TableCell>
                                      <TableCell>
                                        <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                                          {field.type}
                                        </span>
                                      </TableCell>
                                      <TableCell>
                                        {field.createable ? (
                                          <span className="text-green-600">✓</span>
                                        ) : (
                                          <span className="text-red-600">✗</span>
                                        )}
                                      </TableCell>
                                      <TableCell>
                                        {field.updateable ? (
                                          <span className="text-green-600">✓</span>
                                        ) : (
                                          <span className="text-red-600">✗</span>
                                        )}
                                      </TableCell>
                                      <TableCell>
                                        {!field.nillable && field.createable ? (
                                          <span className="text-red-600">✓</span>
                                        ) : (
                                          <span className="text-gray-400">✗</span>
                                        )}
                                      </TableCell>
                                      <TableCell>
                                        <span className={`px-2 py-1 text-xs rounded ${permissionColor}`}>
                                          {permissionLevel}
                                        </span>
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
                              </TableBody>
                            </Table>
                          </div>
                        </div>

                        {/* Additional Security Information */}
                        <div className="grid md:grid-cols-2 gap-4">
                          <Card>
                            <CardHeader>
                              <CardTitle className="text-sm">Special Field Types</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                              <div className="flex justify-between">
                                <span>External ID Fields:</span>
                                <span className="font-medium">
                                  {fields.filter(f => f.externalId).length}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Unique Fields:</span>
                                <span className="font-medium">
                                  {fields.filter(f => f.unique).length}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Calculated Fields:</span>
                                <span className="font-medium">
                                  {fields.filter(f => f.calculated).length}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Auto Number Fields:</span>
                                <span className="font-medium">
                                  {fields.filter(f => f.autoNumber).length}
                                </span>
                              </div>
                            </CardContent>
                          </Card>

                          <Card>
                            <CardHeader>
                              <CardTitle className="text-sm">Field Capabilities</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                              <div className="flex justify-between">
                                <span>Sortable Fields:</span>
                                <span className="font-medium">
                                  {fields.filter(f => f.sortable).length}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Filterable Fields:</span>
                                <span className="font-medium">
                                  {fields.filter(f => f.filterable).length}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Groupable Fields:</span>
                                <span className="font-medium">
                                  {fields.filter(f => f.groupable).length}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Reference Fields:</span>
                                <span className="font-medium">
                                  {fields.filter(f => f.referenceTo && f.referenceTo.length > 0).length}
                                </span>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Shield className="w-12 h-12 mx-auto mb-4" />
                        <h3 className="text-lg font-medium">No Field Data Available</h3>
                        <p className="text-sm">
                          Select an object to view its field-level security permissions
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
            </div>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Eye className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">Select an Object</h3>
                  <p className="text-muted-foreground">
                    Choose an object from the list to explore its metadata
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 border border-red-200 rounded-md bg-red-50">
          <p className="text-red-800">{error}</p>
        </div>
      )}
    </div>
  );
}
